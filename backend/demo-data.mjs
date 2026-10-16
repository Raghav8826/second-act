export const DATASET = 'second-act-demo-v1';
export const prefix = key => `${DATASET}:${key}`;
export const uses = [
  ['backdrop','Backdrops'],['lighting','Lighting'],['reflector','Reflectors'],
  ['capture','Camera equipment'],['support','Stands and supports'],['set','Set building'],
  ['costume','Costumes and textiles'],['stitching','Sewing'],['projection','Projection']
].map(([key,name])=>({id:prefix(`use:${key}`),key,name}));
export const disciplines = [
  {key:'photography',name:'Photography',uses:['backdrop','lighting','reflector','capture','support']},
  {key:'filmmaker',name:'Filmmaking',uses:['backdrop','lighting','set','capture','support','projection']},
  {key:'theatre',name:'Theatre',uses:['backdrop','lighting','set','costume','support','projection']},
  {key:'fashion',name:'Fashion design',uses:['costume','stitching','backdrop']}
].map(d=>({...d,id:prefix(`discipline:${d.key}`)}));
export const clubs = [
  {id:prefix('club:stage-store'),name:'Stage Store',collection:'Collect from the fictional campus theatre store.'},
  {id:prefix('club:photo-collective'),name:'Photo Collective',collection:'Collect from the fictional photography club room.'},
  {id:prefix('club:art-workshop'),name:'Art Workshop',collection:'Collect from the fictional campus art workshop.'},
  {id:prefix('club:textile-circle'),name:'Textile Circle',collection:'Collect from the fictional textile studio.'}
];
const resource=(key,name,owner,quantity,dailyCost,unit,dimensions,materials,purposes,restrictions,description)=>({
  id:prefix(`resource:${key}`),key,name,ownerId:prefix(`club:${owner}`),quantity,dailyCost,unit,
  dimensions,materials,purposes,restrictions,description,condition:'Good — fictional demo inventory'
});
export const resources = [
  resource('blue-fabric','Blue backdrop fabric','stage-store',1,0,'roll','3 × 4 m',['cotton'],['backdrop','set','costume'],'Return intact. No cutting or permanent paint.','A reusable blue fabric roll for backgrounds, draping or temporary costumes.'),
  resource('teal-curtains','Teal curtain pair','photo-collective',2,0,'pair','2 × 2.8 m per pair',['cotton'],['backdrop','set'],'Return clean. Use removable clips only.','A pair of teal curtains that can stand in for a fabric backdrop.'),
  resource('white-sheet','White cotton sheet','stage-store',2,40,'sheet','2 × 3 m',['cotton'],['backdrop','costume'],'No dye, cutting or permanent marks.','A neutral background or fabric base for a temporary costume.'),
  resource('foam-boards','White foam-board panels','art-workshop',3,0,'panel','1 × 1 m',['foam board'],['reflector','set','backdrop'],'Return intact. Tape must be removable.','Lightweight panels for small sets, backgrounds or bouncing existing light.'),
  resource('led-panel','Portable LED panel','photo-collective',2,150,'light','25 × 20 cm',['electronics'],['lighting'],'Indoor use only. Return the supplied adapter.','A dimmable light for a small shoot or an indoor performance.'),
  resource('light-stand','Adjustable light stand','photo-collective',2,30,'stand','Maximum height 2 m',['aluminium'],['support','lighting'],'Use indoors on level ground; follow its listed load rating.','A stand for supported lightweight lighting equipment.'),
  resource('camera-body','Demo mirrorless camera body','photo-collective',1,300,'body','Small camera body',['electronics'],['capture'],'Return with battery and charger. The required lens is listed separately.','A fictional camera body with a recorded compatible lens requirement.'),
  resource('standard-lens','Compatible 50 mm lens','photo-collective',1,100,'lens','Standard lens',['optical glass','aluminium'],['capture'],'Compatible with the demo camera body only. Return both caps.','The lens recorded as compatible with the demo camera body.'),
  resource('sewing-machine','Tabletop sewing machine','textile-circle',1,100,'machine','45 × 20 cm',['electronics','steel'],['stitching'],'Studio use only. Prior sewing-machine experience required.','A shared machine for supported fabric work in the fictional studio.'),
  resource('fabric-bundle','Offcut fabric bundle','textile-circle',4,0,'bundle','Approximately 1 kg per bundle',['mixed textiles'],['costume','set'],'Offcuts may be cut and permanently altered.','Reusable offcuts for patchwork, small costumes and set details.')
];
export const materials=[...new Set(resources.flatMap(r=>r.materials))].map(name=>({id:prefix(`material:${name}`),name}));
export const bookings = [
  {id:prefix('booking:blue-fabric-october'),resourceId:prefix('resource:blue-fabric'),startDate:'2026-10-25',endDate:'2026-10-27',quantity:1,status:'confirmed'},
  {id:prefix('booking:lens-october'),resourceId:prefix('resource:standard-lens'),startDate:'2026-10-25',endDate:'2026-10-27',quantity:1,status:'confirmed'},
  {id:prefix('booking:stand-october'),resourceId:prefix('resource:light-stand'),startDate:'2026-10-26',endDate:'2026-10-26',quantity:1,status:'confirmed'}
];
export const requirements=[{resourceId:prefix('resource:camera-body'),requiredId:prefix('resource:standard-lens')}];
