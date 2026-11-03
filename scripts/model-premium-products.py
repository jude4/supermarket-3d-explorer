"""Original product meshes, UVs and PBR material regions. Blender Z-up, GLB Y-up.
No third-party meshes/textures. Run blender --background --python scripts/model-premium-products.py.
Normalized assets are scaled to authoritative catalogue dimensions by the client.
"""
import bpy, math, json, os
from pathlib import Path
bpy.context.preferences.filepaths.save_version=0
ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/'public/models/products';OUT.mkdir(parents=True,exist_ok=True)
SOURCE=ROOT/'assets/blender/products';SOURCE.mkdir(parents=True,exist_ok=True)
def material(name,color,rough=.4,metal=0,trans=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
 if 'Transmission Weight' in p.inputs:p.inputs['Transmission Weight'].default_value=trans
 p.inputs['IOR'].default_value=1.46
 return m
def lathe(name,profile,mat,segments=64):
 verts=[];faces=[]
 for r,z in profile:
  for i in range(segments):a=i*math.tau/segments;verts.append((r*math.cos(a),r*math.sin(a),z))
 for j in range(len(profile)-1):
  for i in range(segments):a=j*segments+i;b=j*segments+(i+1)%segments;faces.append((a,b,b+segments,a+segments))
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update();o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);o.data.materials.append(mat)
 for p in mesh.polygons:p.use_smooth=True
 uv=mesh.uv_layers.new(name='Surface UV')
 for poly in mesh.polygons:
  for li in poly.loop_indices:
   vi=mesh.loops[li].vertex_index;uv.data[li].uv=((vi%segments)/segments,vi//segments/(len(profile)-1))
 return o
def box(name,loc,size,mat,bevel=.015):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(mat)
 mod=o.modifiers.new('Manufactured edge bevel','BEVEL');mod.width=bevel;mod.segments=3;bpy.ops.object.modifier_apply(modifier=mod.name);o.modifiers.new('Weighted normals','WEIGHTED_NORMAL');return o
def label(name,front=True,curved=False,zmin=.19,zmax=.76,width=.91):
 # Front is Blender -Y (GLB +Z); UV follows readable left-to-right artwork.
 verts=[];faces=[];n=32 if curved else 1
 for z in [zmin,zmax]:
  for i in range(n+1):
   u=i/n
   if curved:a=(u-.5)*1.8;x=math.sin(a)*.503;y=-math.cos(a)*.503
   else:x=(u-.5)*width;y=-.512
   if not front:x=-x;y=-y
   verts.append((x,y,z))
 for i in range(n):faces.append((i,i+1,i+1+n+1,i+n+1))
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update();o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);o.data.materials.append(material(name,(1,1,1),.55));uv=mesh.uv_layers.new(name='Packaging UV')
 for p in mesh.polygons:
  for li in p.loop_indices:
   vi=mesh.loops[li].vertex_index;uv.data[li].uv=(vi%(n+1)/n,vi//(n+1))
 return o
exported=0
for kind in ['water-bottle','drink-can','milk-carton','cereal-box','cleaning-spray']:
 if os.environ.get('PREMIUM_ONLY') and os.environ['PREMIUM_ONLY']!=kind:continue
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 plastic=material('Satin polymer',(.78,.87,.91),.25);metal=material('Brushed aluminium',(.63,.68,.7),.24,1);cap=material('Moulded cap',(.06,.23,.38),.35);paper=material('Uncoated cardboard',(.86,.83,.74),.78)
 if kind=='water-bottle':
  plastic=material('Thin PET',(.83,.94,.98),.16,0,.65)
  liquid=material('Water',(.69,.88,.96),.08,0,.8)
  lathe('Water fill',[(0,.05),(.43,.05),(.44,.61),(.37,.73),(0,.73)],liquid)
 if kind=='drink-can':
  lacquer=material('Printed lacquer',(.1,.3,.2),.32,.12)
  lathe('Drawn aluminium body',[(0,0),(.43,0),(.46,.03),(.46,.08),(.495,.15),(.495,.84),(.45,.92),(.45,.98)],lacquer)
  for z in [.025,.975]:lathe('Rolled rim',[(.43,z),(.455,z-.006),(.468,z+.006),(.455,z+.018),(.43,z)],metal)
  lathe('Recessed lid',[(0,.964),(.38,.964),(.43,.97)],metal)
  bpy.ops.mesh.primitive_torus_add(major_radius=.075,minor_radius=.016,major_segments=32,minor_segments=10,location=(0,-.07,.985));o=bpy.context.object;o.name='Pull tab';o.scale.y=1.6;o.data.materials.append(metal)
 elif kind in ['water-bottle','cleaning-spray']:
  lathe('Moulded container',[(0,0),(.38,0),(.47,.035),(.49,.09),(.48,.65),(.43,.73),(.26,.83),(.17,.87),(.17,.95),(0,.95)],plastic)
  for z in [.11,.16,.67]:lathe('Moulded shoulder rib',[(.478,z-.008),(.49,z),(.478,z+.008)],plastic)
  lathe('Threaded closure',[(0,.91),(.2,.91),(.2,.99),(0,.99)],cap,48)
  for i in range(40):a=i*math.tau/40;box('Cap grip flute',(.2*math.cos(a),.2*math.sin(a),.955),(.009,.009,.065),cap,.002)
  if kind=='cleaning-spray':
   box('Trigger housing',(.09,0,1.02),(.55,.22,.15),cap,.04);box('Spray nozzle',(.36,0,1.015),(.09,.18,.11),cap,.02);o=box('Curved finger trigger',(.19,0,.86),(.07,.1,.24),cap,.025);o.rotation_euler.y=-.24
 elif kind=='milk-carton':
  box('Folded coated carton',(0,0,.39),(.98,.98,.78),paper,.012)
  verts=[(-.49,-.49,.78),(.49,-.49,.78),(-.49,.49,.78),(.49,.49,.78),(-.49,0,.98),(.49,0,.98)];faces=[(0,1,5,4),(2,4,5,3),(0,4,2),(1,3,5)];me=bpy.data.meshes.new('Gable folds');me.from_pydata(verts,[],faces);o=bpy.data.objects.new('Gable folds',me);bpy.context.collection.objects.link(o);o.data.materials.append(paper)
  box('Heat sealed ridge',(0,0,.993),(.99,.035,.035),paper,.005)
  lathe('Screw closure',[(0,0),(.085,0),(.085,.06),(0,.06)],cap,48).location=(.2,-.23,.87)
 else:
  box('Printed cardboard box',(0,0,.5),(.99,.99,1),paper,.009)
  for z in [.012,.988]:box('Folded end flap',(0,0,z),(.965,.965,.008),paper,.002)
  box('Side glue seam',(.498,0,.5),(.005,.98,.97),paper,.001)
 if kind in ['milk-carton','cereal-box']:
  top=.765 if kind=='milk-carton' else .985
  label('LabelFront',True,False,.015,top,.98);label('LabelBack',False,False,.015,top,.98)
  for side in [-1,1]:
   verts=[(side*.508,-.49,.015),(side*.508,.49,.015),(side*.508,.49,top),(side*.508,-.49,top)]
   faces=[(0,1,2,3) if side>0 else (3,2,1,0)]
   me=bpy.data.meshes.new('Side panel UV');me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new('LabelBackSide'+str(side),me);bpy.context.collection.objects.link(o);me.materials.append(material(o.name,(1,1,1),.65));uv=me.uv_layers.new(name='Packaging UV')
   for poly in me.polygons:
    for li in poly.loop_indices:
     u,v=[(0,0),(1,0),(1,1),(0,1)][me.loops[li].vertex_index];uv.data[li].uv=(u if side>0 else 1-u,v)
 else:
  label('LabelFront',True,True);label('LabelBack',False,True)
 # Author physical family proportions (approximate references, not verified SKU measurements).
 width,depth={'water-bottle':(.28,.28),'drink-can':(.57,.57),'milk-carton':(.34,.34),'cereal-box':(.65,.20),'cleaning-spray':(.42,.25)}[kind]
 for obj in bpy.context.scene.objects:
  if obj.type=='MESH':
   obj.location.x*=width;obj.location.y*=depth;obj.scale.x*=width;obj.scale.y*=depth
 # Join manufactured details by material, retaining separate named packaging UV regions.
 for mat in list(bpy.data.materials):
  objects=[o for o in bpy.context.scene.objects if o.type=='MESH' and o.active_material==mat and not o.name.startswith('Label')]
  if len(objects)>1:
   bpy.ops.object.select_all(action='DESELECT')
   for o in objects:o.select_set(True)
   bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join()
 bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/(kind+'.blend')))
 bpy.ops.export_scene.gltf(filepath=str(OUT/(kind+'.glb')),export_format='GLB',export_apply=True,export_yup=True)
 exported+=1
print(f'Exported {exported} original product assets with packaging UVs and PBR regions.')
