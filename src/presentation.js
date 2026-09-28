// Keep expensive image work out of the animation loop. Original art stays untouched.
export function canvasSize(width,height,dpr=1){
  const scale=Math.min(Math.max(1,width)/1280,Math.max(1,height)/720)*Math.min(Math.max(1,dpr),1.5);
  const bounded=Math.min(scale,1.5);
  return {width:Math.max(1,Math.round(1280*bounded)),height:Math.max(1,Math.round(720*bounded))};
}

export function trimFrame(pixels,width,height,frame){
  let x0=frame.x+frame.w,y0=frame.y+frame.h,x1=-1,y1=-1;
  for(let y=frame.y;y<Math.min(height,frame.y+frame.h);y++){
    for(let x=frame.x;x<Math.min(width,frame.x+frame.w);x++){
      if(pixels[(y*width+x)*4+3]<=80||frame.omit?.some(q=>x>=q.x&&x<q.x+q.w&&y>=q.y&&y<q.y+q.h))continue;
      x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);
    }
  }
  return x1<0?{x:frame.x,y:frame.y,w:frame.w,h:frame.h}:{x:x0,y:y0,w:x1-x0+1,h:y1-y0+1};
}

export async function prepareArtwork(images,frames,onProgress=()=>{}){
  const crops={},views={},cache=new Map(),pixels=new Map();
  const entries=Object.entries(frames);let scans=0,done=0;
  for(const [name,r]of entries){
    const key=JSON.stringify([r.sheet,r.x,r.y,r.w,r.h,r.omit]);
    let entry=cache.get(key);
    if(!entry){
      const im=images[r.sheet];
      if(!pixels.has(r.sheet)){
        const sheet=document.createElement('canvas');sheet.width=im.width;sheet.height=im.height;
        const c=sheet.getContext('2d',{willReadFrequently:true});c.drawImage(im,0,0);
        pixels.set(r.sheet,c.getImageData(0,0,im.width,im.height).data);
      }
      const crop=trimFrame(pixels.get(r.sheet),im.width,im.height,r);scans++;
      const view=document.createElement('canvas');view.width=crop.w+4;view.height=crop.h+4;
      const c=view.getContext('2d');c.drawImage(im,crop.x,crop.y,crop.w,crop.h,2,2,crop.w,crop.h);
      for(const q of r.omit||[])c.clearRect(q.x-crop.x+2,q.y-crop.y+2,q.w,q.h);
      entry={crop,view};cache.set(key,entry);
      // Let the loading indicator paint while processing large sprite atlases.
      if(scans%4===0)await new Promise(resolve=>setTimeout(resolve,0));
    }
    crops[name]=entry.crop;views[name]=entry.view;onProgress(++done/entries.length);
  }
  return {crops,views,scans,aliases:entries.length};
}

export function prepareScenery(images,crops){
  const backgrounds={},tiles={};
  for(const [name,im]of Object.entries(images))if(name.startsWith('bg_')){
    const view=document.createElement('canvas');view.height=720;view.width=Math.ceil(im.width/im.height*720);
    view.getContext('2d').drawImage(im,0,0,view.width,view.height);backgrounds[name]=view;
  }
  for(let i=0;i<8;i++){
    const name='terrain'+i,r=crops[name],im=images[name],view=document.createElement('canvas');
    view.height=i%2?58:142;view.width=Math.ceil(view.height*r.w/r.h);
    view.getContext('2d').drawImage(im,r.x,r.y,r.w,r.h,0,0,view.width,view.height);tiles[name]=view;
  }
  return {backgrounds,tiles};
}
