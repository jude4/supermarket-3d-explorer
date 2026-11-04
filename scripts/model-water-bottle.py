"""500 ml PET bottle study: original mesh based on supplied multi-view reference.
Approximate dimensions; no claim of an exact manufactured-product scan.
Run: blender --background --python scripts/model-water-bottle.py
"""
import bpy,math
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
bpy.context.preferences.filepaths.save_version=0
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def mat(name,col,rough=.2,trans=0,ior=1.46):
 m=bpy.data.materials.new(name);m.diffuse_color=(*col,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*col,1);p.inputs['Roughness'].default_value=rough;p.inputs['IOR'].default_value=ior;p.inputs['Transmission Weight'].default_value=trans;return m
pet=mat('Clear PET shell',(.99,1,1),.035,1,1.57)
water=mat('Clear water',(.96,.99,1),.025,1,1.333)
blue=mat('Blue HDPE closure',(.012,.19,.53),.29)
labelmat=mat('Printed wrap label',(1,1,1),.3)
def surface(name,rings,material,n=128,spiral=False,wrap=False):
 vs=[];faces=[]
 for r,z in rings:
  for i in range(n+1):
   u=i/n;a=(u-.25)*math.tau-math.pi/2
   radius=r
   if spiral and .014<z<.084:radius+=.0015*math.sin((z/.013)*math.tau+a*2)
   if spiral and z<.014 and r>.015:radius+=.0018*math.cos(a*5)*(1-z/.014)
   height=z
   if spiral and r>.015 and z<.014:height+=.0025*(1-math.cos(a*5))*(1-z/.014)
   vs.append((radius*math.cos(a),radius*math.sin(a),height))
 for j in range(len(rings)-1):
  for i in range(n):k=j*(n+1)+i;faces.append((k,k+1,k+n+2,k+n+1))
 me=bpy.data.meshes.new(name);me.from_pydata(vs,[],faces);me.update();o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);me.materials.append(material)
 for p in me.polygons:p.use_smooth=True
 uv=me.uv_layers.new(name='Continuous cylindrical UV')
 for p in me.polygons:
  for li in p.loop_indices:
   v=me.loops[li].vertex_index;uv.data[li].uv=(v%(n+1)/n,v//(n+1)/(len(rings)-1))
 return o
# A continuous, genuinely hollow shell, including concave petaloid base and neck wall.
outer=[(0,.010),(.008,.009),(.019,.006),(.026,.002),(.030,.003),(.032,.010)]
for j in range(1,61):
 z=.010+j*.00125;r=.032-.0010*(.5+.5*math.cos(z/.013*math.tau));outer.append((r,z))
outer += [(.032,.086),(.032,.149),(.0325,.153),(.031,.156),(.0325,.160),(.031,.164),(.032,.169),(.030,.176),(.025,.185),(.019,.193),(.012,.199),(.0115,.207),(.0115,.215)]
inner=[(max(0,r-.00035),z+.00035)for r,z in reversed(outer)]
surface('PET shell with spiral ribs and five-lobe base',outer+inner,pet,128,True)
liquid=[(max(0,r-.00065),z+.00035) for r,z in outer if z<=.193]+[(.017,.195),(.0166,.1955),(0,.1955)]
surface('Water volume and meniscus',liquid,water,128,True)
surface('Blue screw cap',[(0,.213),(.0133,.213),(.0138,.214),(.0138,.229),(.0131,.231),(.011,.232),(0,.232)],blue,128)
surface('Tamper evident ring',[(.0118,.208),(.013,.208),(.013,.212),(.0118,.212)],blue,96)
# Fine vertical grip flutes are part of the closure mesh, rather than a smooth cylinder.
for i in range(80):
 a=i*math.tau/80;bpy.ops.mesh.primitive_cube_add(size=1,location=(.01385*math.cos(a),.01385*math.sin(a),.2215));o=bpy.context.object;o.name='Moulded cap grip';o.dimensions=(.0004,.0004,.013);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(blue)
 bevel=o.modifiers.new('Rounded flute','BEVEL');bevel.width=.00012;bevel.segments=2;bpy.ops.object.modifier_apply(modifier=bevel.name)
# A single UV sleeve; front at u=.25, back at u=.75, seam on the side.
surface('WaterWrapLabel',[(.03245,.087),(.03245,.1505)],labelmat,192)
for material in [blue]:
 objects=[o for o in bpy.context.scene.objects if o.type=='MESH' and o.active_material==material]
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:o.select_set(True)
 bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();objects[0].name='Cap and tamper ring'
source=ROOT/'assets/blender/products/water-500ml.blend';source.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(source))
out=ROOT/'public/products/beverages/spring-water/500ml/model/product.glb';out.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(out),export_format='GLB',export_yup=True,export_apply=True)
print('Exported original 500 ml bottle study: PET shell, water, cap, continuous label UV.')
