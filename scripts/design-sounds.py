"""Reproducible original sound design. Python standard library only; no recordings."""
from pathlib import Path
import math, random, wave, struct, json

ROOT=Path(__file__).resolve().parents[1]
RATE=24000
rng=random.Random(1989)
bank={}

def silence(seconds): return [0.0]*round(seconds*RATE)
def mix(*layers):
    out=[0.0]*max(map(len,layers))
    for layer in layers:
        for i,v in enumerate(layer): out[i]+=v
    return out

def delay(a,seconds,gain=1): return silence(seconds)+[v*gain for v in a]
def tone(seconds,freq,end=None,amp=1,decay=8,attack=.001,partials=((1,1),)):
    n=round(seconds*RATE); phase=0; out=[]
    for i in range(n):
        t=i/RATE; phase+=2*math.pi*(freq*((end or freq)/freq)**(i/max(1,n-1)))/RATE
        env=min(1,t/max(attack,1/RATE))*math.exp(-decay*t)*(min(1,(seconds-t)/.008))
        out.append(amp*env*sum(g*math.sin(phase*k) for k,g in partials))
    return out

def noise(seconds,low=5000,high=0,amp=1,decay=12,attack=.001):
    out=[]; lo=0; hi=0; a=1-math.exp(-2*math.pi*low/RATE); b=1-math.exp(-2*math.pi*max(1,high)/RATE)
    for i in range(round(seconds*RATE)):
        t=i/RATE; lo+=a*(rng.uniform(-1,1)-lo); hi+=b*(lo-hi)
        env=min(1,t/max(attack,1/RATE))*math.exp(-decay*t)*min(1,(seconds-t)/.012)
        out.append((lo-hi if high else lo)*amp*env)
    return out

def swish(seconds,low,high,amp=1):
    a=noise(seconds,low,high,amp,decay=0,attack=.001)
    return [v*math.sin(math.pi*i/len(a))**1.5 for i,v in enumerate(a)]

def pluck(freq,seconds=2.1,decay=.996,body=.2):
    n=round(RATE/freq-.5); ring=[rng.uniform(-1,1) for _ in range(n)]; out=[]
    # A damped string with a quiet body resonance, not a continuously running oscillator.
    for i in range(round(seconds*RATE)):
        j=i%n;v=ring[j];ring[j]=decay*.5*(v+ring[(j+1)%n]);t=i/RATE
        out.append((v+body*math.sin(2*math.pi*freq*t)*math.exp(-3*t))*min(1,t/.0015)*min(1,(seconds-t)/.035))
    return out

def metal(freq=2200,seconds=.18):
    return mix(noise(.025,9000,3000,.22,80),tone(seconds,freq,amp=.20,decay=24,partials=((1,1),(1.47,.4),(2.63,.18))))

def finish(name,signal,peak=.75,echo=False):
    if echo: signal=mix(signal,delay(signal,.081,.10),delay(signal,.137,.055))
    peak_in=max(abs(v) for v in signal) or 1
    # Preserve designed dynamic envelopes; leave headroom for overlapping actions.
    signal=[v*peak/peak_in for v in signal]
    filename=name.replace('_','-')+'.wav'
    with wave.open(str(ROOT/'sound'/filename),'wb') as f:
        f.setnchannels(1);f.setsampwidth(2);f.setframerate(RATE)
        f.writeframes(struct.pack('<'+'h'*len(signal),*(round(max(-.98,min(.98,v))*32767) for v in signal)))
    bank[name]='sound/'+filename
    return signal

shot=mix(noise(.075,10500,950,1.4,55),noise(.28,1800,100,1.0,17),tone(.34,135,43,.95,13),delay(metal(2600,.06),.006,.22))
finish('revolver',shot,.86,True)
finish('enemy_shot',mix(noise(.19,5800,450,1,28),tone(.25,170,62,.5,20)),.69,True)
finish('pie_throw',mix(swish(.17,2600,300,.6),tone(.12,160,85,.25,17)),.40)
finish('stretch',mix(swish(.11,3600,400,.6),tone(.13,155,460,.23,1,partials=((1,1),(2,.16)))),.45)
finish('hand_snap',mix(noise(.06,8000,900,.9,48),tone(.18,205,60,.6,19),noise(.13,1500,100,.5,22)),.78,True)
finish('recoil',mix(tone(.20,430,85,.7,18,partials=((1,1),(2.01,.18))),swish(.17,2800,500,.23)),.39)
finish('slap_hit',mix(noise(.095,7000,450,.8,38),tone(.22,165,52,.9,18),delay(noise(.07,2400,100,.45,35),.02)),.83)
finish('bullet_hit',mix(noise(.095,3000,400,.7,40),tone(.11,175,75,.5,28)),.60)
finish('ricochet',mix(tone(.40,2100,430,.4,12,partials=((1,1),(1.618,.25))),noise(.09,9500,4000,.4,35)),.58,True)
finish('reload_open',mix(metal(1750,.1),delay(metal(2900,.13),.055,.55)),.55)
finish('reload_turn',mix(*(delay(metal(2200+i*150,.075),i*.054,.8-i*.055) for i in range(6))),.45)
finish('reload_close',mix(metal(1350,.16),tone(.1,240,100,.35,36),delay(metal(3200,.05),.025,.35)),.68)
for k in range(3):
    finish('step_dirt'+str(k),mix(noise(.14,3100,800,.6,24),tone(.09,105+k*7,55,.5,28),delay(noise(.10,5500,2200,.25,28),.025)),.38)
    finish('step_wood'+str(k),mix(tone(.12,180+k*22,110,.7,24,partials=((1,1),(2.7,.18))),noise(.10,2300,700,.45,33),delay(metal(1400,.075),.018,.08)),.44)
finish('land',mix(tone(.22,90,35,.8,20),noise(.19,3300,500,.55,25)),.62)
finish('jump',mix(noise(.12,3800,700,.4,26),swish(.17,1900,300,.24)),.30)
finish('roll',mix(swish(.27,2200,280,.6),delay(noise(.14,4000,1500,.25,15),.04)),.50)
finish('hurt',mix(tone(.30,110,42,.7,12),noise(.13,1900,250,.45,30),tone(.25,146,66,.1,10)),.70)
finish('death',mix(pluck(82.4,1.4),delay(pluck(77.8,1.35),.05,.55),tone(.7,95,32,.4,5)),.56,True)
finish('coin',mix(metal(2300,.26),delay(metal(3450,.22),.045,.62)),.43)
finish('relic',mix(*(delay(pluck(f,.9),i*.10,.7) for i,f in enumerate([329.6,493.9,659.3,987.8]))),.60,True)
finish('secret',mix(*(delay(tone(.8,f,amp=.5,decay=6,partials=((1,1),(2.01,.22))),i*.095) for i,f in enumerate([392,493.9,587.3,784]))),.60,True)
finish('checkpoint',mix(*(delay(pluck(f,1.2),i*.055,.6) for i,f in enumerate([164.8,246.9,329.6,392]))),.60,True)
finish('heal',mix(tone(.6,392,amp=.3,decay=6),delay(tone(.6,659.3,amp=.25,decay=6),.10)),.48,True)
finish('shield',mix(metal(890,.35),tone(.5,360,720,.3,8)),.57,True)
finish('warning_charge',mix(noise(.30,1700,350,.5,5),tone(.32,90,145,.3,5)),.56)
finish('warning_high',mix(tone(.28,670,740,.4,9),delay(metal(2100,.10),.14,.3)),.44)
finish('warning_low',mix(tone(.20,115,90,.5,12),delay(tone(.18,115,90,.5,12),.18)),.57)
finish('slam',mix(tone(.55,82,28,1,8),noise(.35,1600,65,.7,13),delay(noise(.25,3200,800,.3,12),.055)),.85,True)
finish('rage',mix(tone(.9,65,36,.6,4,partials=((1,1),(1.5,.35))),noise(.7,1900,160,.5,6)),.67,True)
finish('victory',mix(*(delay(pluck(f,1.4),i*.11) for i,f in enumerate([164.8,246.9,329.6,392,493.9]))),.65,True)
finish('click',mix(metal(1450,.045),noise(.025,1800,500,.18,90)),.20)
finish('guitar',pluck(164.81,2.6,.997,.18),.73)
finish('bass',pluck(82.41,1.4,.993,.33),.73)
finish('harmonic',tone(1.7,659.25,amp=.8,decay=3.5,attack=.006,partials=((1,1),(2.002,.14),(3,.025))),.57)
finish('brush',swish(.15,7500,2700,.6),.30)
finish('kick',mix(tone(.22,86,40,.8,20),noise(.025,1800,300,.1,70)),.58)
finish('rim',mix(tone(.09,1050,700,.2,55),noise(.065,3400,750,.4,42)),.38)
for scene in ['desert','town','saloon','woodland']:
    duration=8; n=round(duration*RATE)
    a=noise(duration,360 if scene!='saloon' else 180,60,.55,0,.06)
    rustle=noise(duration,2400,1100,.10 if scene=='woodland' else .035,0,.06)
    a=[(v+rustle[i])*(.72+.14*math.sin(2*math.pi*i/n)+.10*math.sin(6*math.pi*i/n)) for i,v in enumerate(a)]
    if scene=='woodland':
        for when,f in [(1.2,2500),(1.37,3100),(5.2,2850),(5.38,2300)]:a=mix(a,delay(tone(.095,f,f*1.24,.055,25),when))
    if scene in ['town','saloon']:
        for when in [2.3,6.1]:a=mix(a,delay(tone(.25,310,215,.024,10,partials=((1,1),(2.3,.24))),when))
    a=a[:n]
    # Short fades make loop boundaries click-free.
    a=[v*min(1,i/(RATE*.08),(n-1-i)/(RATE*.08)) for i,v in enumerate(a)]
    finish('amb_'+scene,a,.32)
(ROOT/'src/sound-bank.js').write_text('// Original sounds synthesized by scripts/design-sounds.py; no third-party media.\nexport const SOUND_ASSETS='+json.dumps(bank,indent=2)+';\n')
print(f'Created {len(bank)} original mono PCM sounds at {RATE} Hz ({sum((ROOT/v).stat().st_size for v in bank.values())/1048576:.2f} MB).')
