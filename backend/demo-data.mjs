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
// Additional fictional stock; consumable charges are demo daily access costs,
// not real supplier prices. Alteration permissions are explicit graph facts.
const extra=(key,name,owner,quantity,cost,unit,material,purposes,canCut=false,canDye=false,description='Reusable fictional workshop resource.')=>{
  const r=resource(key,name,owner,quantity,cost,unit,'See collection instructions',[material],purposes,
    canCut?'May be cut and permanently altered.':'Return intact. No cutting, dye or permanent alterations.',description);
  return {...r,canCut,canDye};
};
resources.push(
  extra('cotton-offcuts','Cotton appliqué offcuts','textile-circle',6,10,'bundle','cotton',['costume'],true,true),
  extra('teal-offcuts','Teal peacock-motif offcuts','textile-circle',4,15,'bundle','cotton',['costume'],true,true),
  extra('gold-trim','Gold decorative trim','textile-circle',5,10,'bundle','trim',['costume'],true,false),
  extra('lining','Cotton lining pieces','textile-circle',4,15,'bundle','cotton',['costume'],true,true),
  extra('embroidery-hoop','Embroidery hoop','textile-circle',2,15,'hoop','wood',['stitching']),
  extra('embroidery-needles','Embroidery needle kit','textile-circle',3,5,'kit','steel',['stitching']),
  extra('embroidery-floss','Peacock-colour embroidery floss','textile-circle',5,10,'bundle','thread',['costume','stitching'],true,false),
  extra('hand-sewing-kit','Hand-sewing kit','textile-circle',4,5,'kit','steel',['stitching']),
  extra('fabric-scissors','Fabric scissors','textile-circle',3,5,'pair','steel',['stitching']),
  extra('safety-pins','Removable safety-pin kit','textile-circle',5,5,'kit','steel',['stitching']),
  extra('dress-form','Adjustable dress form','textile-circle',1,60,'form','wood',['stitching','costume']),
  extra('sari-drape','Reusable teal draping cloth','stage-store',2,30,'cloth','cotton',['costume','set']),
  extra('tripod','Phone-compatible tripod','photo-collective',3,25,'tripod','aluminium',['support','capture']),
  extra('phone-mount','Tripod phone mount','photo-collective',3,5,'mount','plastic',['support','capture']),
  extra('reflector','Collapsible reflector','photo-collective',2,20,'reflector','textile',['reflector']),
  extra('black-cloth','Black backdrop cloth','stage-store',2,20,'cloth','cotton',['backdrop','set']),
  extra('backdrop-clips','Removable backdrop clips','art-workshop',8,0,'kit','steel',['support','backdrop','costume']),
  extra('projector','Digital projector','stage-store',1,120,'projector','electronics',['projection','set']),
  extra('projection-screen','Portable projection screen','stage-store',1,30,'screen','textile',['projection','backdrop']),
  extra('cardboard','Reusable cardboard offcuts','art-workshop',8,0,'bundle','cardboard',['set','backdrop'],true,false),
  extra('water-based-paint','Water-based set paint','art-workshop',4,10,'kit','paint',['set']),
  extra('paint-brushes','Set painting brushes','art-workshop',4,5,'kit','wood',['set']),
  extra('clamp-light','Indoor clamp light','photo-collective',3,40,'light','electronics',['lighting']),
  extra('diffusion-frame','Reusable diffusion frame','photo-collective',2,15,'frame','textile',['lighting','support']),
  extra('costume-cape','Reusable costume cape','stage-store',2,40,'cape','textile',['costume'])
);
for(const r of resources){r.canCut??=r.key==='fabric-bundle';r.canDye??=false}
export const materials=[...new Set(resources.flatMap(r=>r.materials))].map(name=>({id:prefix(`material:${name}`),name}));
export const bookings = [
  {id:prefix('booking:blue-fabric-october'),resourceId:prefix('resource:blue-fabric'),startDate:'2026-10-25',endDate:'2026-10-27',quantity:1,status:'confirmed'},
  {id:prefix('booking:lens-october'),resourceId:prefix('resource:standard-lens'),startDate:'2026-10-25',endDate:'2026-10-27',quantity:1,status:'confirmed'},
  {id:prefix('booking:stand-october'),resourceId:prefix('resource:light-stand'),startDate:'2026-10-26',endDate:'2026-10-26',quantity:1,status:'confirmed'}
];
bookings.push(
  {id:prefix('booking:sewing-october'),resourceId:prefix('resource:sewing-machine'),startDate:'2026-10-25',endDate:'2026-10-27',quantity:1,status:'confirmed'},
  {id:prefix('booking:hoops-october'),resourceId:prefix('resource:embroidery-hoop'),startDate:'2026-10-25',endDate:'2026-10-27',quantity:2,status:'confirmed'}
);
export const requirements=[['camera-body','standard-lens'],['tripod','phone-mount'],['projector','projection-screen']].map(([a,b])=>({resourceId:prefix(`resource:${a}`),requiredId:prefix(`resource:${b}`)}));

// Each need is mandatory; ACCEPTS edges represent alternative ways to meet it.
const technique=(key,name,discipline,outcome,needs)=>({id:prefix(`technique:${key}`),key,name,discipline,outcome,
  needs:needs.map(([label,operation,options],i)=>({id:prefix(`need:${key}:${i}`),name:label,operation,options:options.map(k=>prefix(`resource:${k}`))}))});
export const techniques=[
  technique('embroidery','Hand-embroidered peacock motif','fashion','Textured peacock detailing; requires embroidery experience.',[
    ['Embroidery base','cut',['cotton-offcuts','teal-offcuts','white-sheet']],['Hoop','none',['embroidery-hoop']],['Needles','none',['embroidery-needles']],['Decorative thread','cut',['embroidery-floss']]]),
  technique('machine-applique','Machine-sewn peacock appliqué','fashion','Layered peacock shapes stitched onto user-owned garment fabric.',[
    ['Cuttable motif fabric','cut',['teal-offcuts','cotton-offcuts','blue-fabric']],['Sewing machine','none',['sewing-machine']],['Cutting tool','none',['fabric-scissors']],['Thread','cut',['embroidery-floss']]]),
  technique('hand-applique','Hand-sewn peacock appliqué','fashion','Layered peacock shapes sewn by hand; slower than machine stitching.',[
    ['Cuttable motif fabric','cut',['teal-offcuts','cotton-offcuts','blue-fabric']],['Hand sewing','none',['hand-sewing-kit']],['Cutting tool','none',['fabric-scissors']],['Thread','cut',['embroidery-floss']]]),
  technique('removable-drape','Removable period-costume draping','fashion','A temporary period-inspired silhouette; not a finished tailored garment.',[
    ['Intact draping cloth','none',['sari-drape','blue-fabric','white-sheet']],['Removable fastenings','none',['safety-pins','backdrop-clips']]]),
  technique('window-portrait','Window-light portrait setup','photography','Bounce existing daylight; a window and user-owned phone are assumptions.',[
    ['Light bounce','none',['foam-boards','reflector']],['Backdrop','none',['teal-curtains','black-cloth','blue-fabric']]]),
  technique('phone-film','Supported phone filmmaking','filmmaker','A stable phone setup; the phone is supplied by the artist.',[
    ['Camera support','none',['tripod']],['Lighting','none',['led-panel','clamp-light']]]),
  technique('painted-set','Painted theatre scenery','theatre','Paint cuttable cardboard; never paint borrowed intact backdrops.',[
    ['Alterable scenery','cut',['cardboard','foam-boards']],['Paint','none',['water-based-paint']],['Brushes','none',['paint-brushes']]])
];
