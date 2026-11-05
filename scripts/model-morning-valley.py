"""Original Morning Valley 500 g box geometry, 0.20 x 0.30 x 0.06 metres.
Artwork is separately authored, not a projection of the composite reference sheet.
"""
import bpy
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'public/products/breakfast/morning-valley/500g'
bpy.context.preferences.filepaths.save_version=0
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def material(name,color,rough=.65,image=None):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough
 if image:
  t=m.node_tree.nodes.new('ShaderNodeTexImage');t.image=bpy.data.images.load(str(OUT/image));m.node_tree.links.new(t.outputs['Color'],p.inputs['Base Color'])
  for file,socket in [('paper-normal.png','Normal'),('paper-roughness.png','Roughness')]:
   t=m.node_tree.nodes.new('ShaderNodeTexImage');t.image=bpy.data.images.load(str(ROOT/'public/textures/pbr'/file));t.image.colorspace_settings.name='Non-Color'
   if socket=='Normal':
    n=m.node_tree.nodes.new('ShaderNodeNormalMap');n.inputs['Strength'].default_value=.1;m.node_tree.links.new(t.outputs['Color'],n.inputs['Color']);m.node_tree.links.new(n.outputs['Normal'],p.inputs['Normal'])
   else:m.node_tree.links.new(t.outputs['Color'],p.inputs[socket])
 return m
front=material('Printed front and back cardboard',(1,1,1),.68,'front-back.png');sides=material('Printed side panels',(1,1,1),.7,'side-panels.png');top=material('Printed closure flap',(1,1,1),.66,'top-panel.png');board=material('Golden cardboard folds',(.75,.49,.12),.78);raw=material('Exposed paperboard edge',(.57,.43,.25),.85)
def mesh(name,verts,faces,mats,indices,uvs):
 me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o)
 for m in mats:me.materials.append(m)
 uv=me.uv_layers.new(name='Packaging face UV')
 for poly,idx,coords in zip(me.polygons,indices,uvs):
  poly.material_index=idx
  for li,co in zip(poly.loop_indices,coords):uv.data[li].uv=co
 return o
def box(name,loc,size,mat,bevel=.00035):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(mat);b=o.modifiers.new('Paperboard edge radius','BEVEL');b.width=bevel;b.segments=3;bpy.ops.object.modifier_apply(modifier=b.name);return o
x=.1;y=.03;lo=.001;hi=.299
v=[(-x,-y,lo),(x,-y,lo),(x,y,lo),(-x,y,lo),(-x,-y,hi),(x,-y,hi),(x,y,hi),(-x,y,hi)]
faces=[(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]
left=[(0,0),(.5,0),(.5,1),(0,1)];right=[(.5,0),(1,0),(1,1),(.5,1)]
body=mesh('Morning Valley printed box',v,faces,[front,sides],[0,1,0,1],[left,left,right,right]);bpy.context.view_layer.objects.active=body;b=body.modifiers.new('Rounded folded corners','BEVEL');b.width=.00065;b.segments=3;bpy.ops.object.modifier_apply(modifier=b.name)
# Main top tuck flap with a small exposed seam and underlying dust flaps.
box('Inner top dust flap left',(-.075,0,.2985),(.05,.058,.0005),board)
box('Inner top dust flap right',(.075,0,.2985),(.05,.058,.0005),board)
mesh('Top printed tuck flap',[(-.0995,-.0295,.300),(.0995,-.0295,.300),(.0995,.028,.300),(-.0995,.028,.300)],[(0,1,2,3)],[top],[0],[[(0,0),(1,0),(1,1),(0,1)]])
box('Top scored closing seam',(0,.0285,.2992),(.198,.0004,.0005),raw,.0001)
# Folded bottom and overlapping glue seam, visible under unrestricted rotation.
mesh('Bottom folded flap',[(-x,-y,lo),(x,-y,lo),(x,y,lo),(-x,y,lo),(-.075,0,0),(.075,0,0)],[(0,4,1),(1,4,5,2),(2,5,3),(3,5,4,0)],[board],[0,0,0,0],[[(0,0)]*3,[(0,0)]*4,[(0,0)]*3,[(0,0)]*4])
for xx in [-.075,.075]:
 box('Bottom pressed fold',(xx,0,.00035),(.0004,.057,.00045),raw,.0001)
box('Bottom glue overlap',(0,0,.0003),(.15,.0006,.0006),board,.00015)
box('Side glued overlap',(.10005,.025,.15),(.00035,.005,.297),board,.0001)
for m in [board,raw]:
 objects=[o for o in bpy.context.scene.objects if o.type=='MESH' and len(o.data.materials)==1 and o.data.materials[0]==m]
 if len(objects)>1:
  bpy.ops.object.select_all(action='DESELECT')
  for o in objects:o.select_set(True)
  bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();bpy.context.object.name=m.name+' details'
for image in bpy.data.images:
 if image.source=='FILE':image.pack()
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'assets/blender/products/morning-valley-500g.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT/'product.glb'),export_format='GLB',export_yup=True,export_apply=True,export_cameras=False,export_lights=False)
print('Exported Morning Valley 500 g GLB')
