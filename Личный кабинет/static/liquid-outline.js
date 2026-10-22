/* Outline-only metaball morph. Geometry is independent of the menu layout. */
(function (root) {
  'use strict';
  const mix = (a, b, t) => a + (b - a) * t;
  const clamp = t => Math.max(0, Math.min(1, t));
  function bezier(t, x1, y1, x2, y2) {
    t = clamp(t);
    if (t === 0 || t === 1) return t;
    const value = (s, a, b) => 3 * (1-s) ** 2 * s * a + 3 * (1-s) * s*s * b + s*s*s;
    let lo = 0, hi = 1;
    for (let i = 0; i < 14; i++) {
      const s = (lo+hi)/2;
      if (value(s,x1,x2) < t) lo=s; else hi=s;
    }
    return value((lo+hi)/2,y1,y2);
  }
  const travel = t => bezier(t, .4, 0, .2, 1);
  const spring = t => bezier(t, .175, .885, .32, 1.275);
  const resting = (y, width) => ({ source: { y, r: 26, length: Math.max(0,width-52) }, head: { y, r: 0, length: 0 }, neck: 0 });

  function sample(motion, now, width) {
    const p = clamp((now-motion.start)/motion.duration);
    const {source,head} = motion.initial;
    if (p >= 1) return resting(motion.target,width);
    const sourceMidR = source.r * .78;
    const headMidR = Math.max(head.r,22);
    const middleY = mix(head.y,motion.target,.7);
    if (p < .38) {
      const e = travel(p/.38);
      return {
        source: { y:source.y, r:mix(source.r,sourceMidR,e), length:mix(source.length,0,e) },
        head: { y:mix(head.y,middleY,e), r:mix(head.r,headMidR,e), length:mix(head.length,0,e) },
        neck: mix(motion.initial.neck,7,e),
      };
    }
    if (p < .67) {
      const u = (p-.38)/.29;
      const e = travel(u);
      return {
        source: { y:source.y, r:sourceMidR*(1-u)**1.2, length:0 },
        head: { y:mix(middleY,motion.target,e), r:mix(headMidR,26,e), length:0 },
        neck: 7*(1-travel(clamp(u/.55))),
      };
    }
    const u = (p-.67)/.33;
    const e = Math.min(1.025,spring(u));
    const bounce = Math.sin(Math.PI*u)*Math.exp(-3*u);
    return {
      source:{y:source.y,r:0,length:0},
      head:{y:motion.target + Math.sign(motion.target-head.y)*2*bounce,r:26+1.2*bounce,length:Math.max(0,width-52)*e},
      neck:0,
    };
  }

  function softUnion(a,b,k) {
    if (!Number.isFinite(a)) return b;
    if (!Number.isFinite(b)) return a;
    const h=Math.max(k-Math.abs(a-b),0)/k;
    return Math.min(a,b)-h*h*h*k/6;
  }
  function capsuleDistance(x,y,blob) {
    if (blob.r < .03) return Infinity;
    const dx=x-Math.max(26,Math.min(26+blob.length,x));
    return Math.hypot(dx,y-blob.y)-blob.r;
  }
  function field(x,y,state) {
    let d=softUnion(capsuleDistance(x,y,state.source),capsuleDistance(x,y,state.head),14);
    if (state.neck > .03 && state.source.r > .03 && state.head.r > .03) {
      const lo=Math.min(state.source.y,state.head.y),hi=Math.max(state.source.y,state.head.y);
      const dy=y-Math.max(lo,Math.min(hi,y));
      d=softUnion(d,Math.hypot(x-26,dy)-state.neck,12);
    }
    return d;
  }
  function capsulePath(blob) {
    const {y,r,length}=blob,x=26-r,w=length+2*r;
    return `M ${x+r} ${y-r} H ${x+w-r} A ${r} ${r} 0 0 1 ${x+w-r} ${y+r} H ${x+r} A ${r} ${r} 0 0 1 ${x+r} ${y-r} Z`;
  }

  // Marching squares extracts the *outer boundary* of the merged field.
  // Two overlapping shapes therefore never leave two strokes on screen.
  function path(state) {
    const blobs=[state.source,state.head].filter(b=>b.r>=.03);
    if (blobs.length===1) return capsulePath(blobs[0]);
    const step=2;
    const x0=-6;
    const y0=Math.floor(Math.min(...blobs.map(b=>b.y-b.r))-8);
    const xEnd=Math.max(...blobs.map(b=>26+b.length+b.r))+8;
    const yEnd=Math.max(...blobs.map(b=>b.y+b.r))+8;
    const cols=Math.ceil((xEnd-x0)/step)+1;
    const rows=Math.ceil((yEnd-y0)/step)+1;
    const values=new Float32Array(cols*rows);
    for(let j=0;j<rows;j++)for(let i=0;i<cols;i++)values[j*cols+i]=field(x0+i*step,y0+j*step,state);
    const vertices=new Map(),adjacent=new Map();
    function edge(a,b) {
      const key=Math.min(a,b)*2+(Math.abs(a-b)===cols?1:0);
      if(!vertices.has(key)) {
        const t=values[a]/(values[a]-values[b]);
        vertices.set(key,[x0+mix(a%cols,b%cols,t)*step,y0+mix(Math.floor(a/cols),Math.floor(b/cols),t)*step]);
      }
      return key;
    }
    function join(a,b) {
      if(!adjacent.has(a))adjacent.set(a,[]);
      if(!adjacent.has(b))adjacent.set(b,[]);
      adjacent.get(a).push(b);adjacent.get(b).push(a);
    }
    for(let j=0;j<rows-1;j++)for(let i=0;i<cols-1;i++) {
      const a=j*cols+i,b=a+1,c=b+cols,d=a+cols;
      const corners=[a,b,c,d];
      const crossings=[];
      for(let k=0;k<4;k++)if((values[corners[k]]<0)!==(values[corners[(k+1)%4]]<0))crossings.push([k,edge(corners[k],corners[(k+1)%4])]);
      if(crossings.length===2)join(crossings[0][1],crossings[1][1]);
      else if(crossings.length===4) {
        const centerInside=field(x0+(i+.5)*step,y0+(j+.5)*step,state)<0;
        const aroundFirst=(values[a]<0)!==centerInside;
        const ids=crossings.map(c=>c[1]);
        if(aroundFirst){join(ids[3],ids[0]);join(ids[1],ids[2]);}
        else{join(ids[0],ids[1]);join(ids[2],ids[3]);}
      }
    }
    const visited=new Set(),paths=[];
    const num=x=>x.toFixed(2);
    for(const start of adjacent.keys()) {
      if(visited.has(start))continue;
      const points=[];let previous=null,current=start;
      while(!visited.has(current)) {
        visited.add(current);points.push(vertices.get(current));
        const neighbors=adjacent.get(current);
        const next=neighbors.find(n=>n!==previous);
        previous=current;current=next;
        if(current===undefined)break;
      }
      if(points.length<3)continue;
      const first=points[0],last=points[points.length-1];
      let result=`M ${num((last[0]+first[0])/2)} ${num((last[1]+first[1])/2)}`;
      for(let i=0;i<points.length;i++) {
        const p=points[i],n=points[(i+1)%points.length];
        result+=` Q ${num(p[0])} ${num(p[1])} ${num((p[0]+n[0])/2)} ${num((p[1]+n[1])/2)}`;
      }
      paths.push(result+' Z');
    }
    return paths.join(' ');
  }
  const api={resting,sample,path,field,travel,spring};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.CabinetLiquid=api;
})(typeof window!=='undefined'?window:this);
