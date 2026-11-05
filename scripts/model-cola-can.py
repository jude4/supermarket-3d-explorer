"""Reference-based standard 330 ml can study, metres; dimensions are estimates."""
import bpy,math,random
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'public/products/beverages/cola/330ml'
bpy.context.preferences.filepaths.save_version=0
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def mat(name,col,metal,rough):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*col,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough;return m
metal=mat('Brushed aluminium',(.62,.65,.68),1,.23);ink=mat('Red printed lacquer',(.7,.006,.012),.35,.29);water=mat('Condensation water',(.98,.99,1),0,.055);p=water.node_tree.nodes.get('Principled BSDF');p.inputs['Transmission Weight'].default_value=1;p.inputs['IOR'].default_value=1.333
nodes=ink.node_tree.nodes;links=ink.node_tree.links;p=nodes.get('Principled BSDF');p.inputs['Coat Weight'].default_value=.65;p.inputs['Coat Roughness'].default_value=.17
for filename,socket,colour in [('basecolor.png','Base Color',True),('roughness.png','Roughness',False),('normal.png','Normal',False)]:
 tex=nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(OUT/filename));tex.image.colorspace_settings.name='sRGB' if colour else 'Non-Color'
 if socket=='Normal':
  n=nodes.new('ShaderNodeNormalMap');n.inputs['Strength'].default_value=.3;links.new(tex.outputs['Color'],n.inputs['Color']);links.new(n.outputs['Normal'],p.inputs[socket])
 else:links.new(tex.outputs['Color'],p.inputs[socket])
def lathe(name,profile,material,N=128):
 verts=[];faces=[]
 # Front Blender -Y corresponds U .25 and GLB +Z.
 for r,z in profile:
  for i in range(N):a=-math.pi+i*math.tau/N;verts.append((r*math.cos(a),r*math.sin(a),z))
 for j in range(len(profile)-1):
  for i in range(N):faces.append((j*N+i,j*N+(i+1)%N,(j+1)*N+(i+1)%N,(j+1)*N+i))
 me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);me.materials.append(material);uv=me.uv_layers.new(name='Cylindrical UV')
 for poly in me.polygons:
  poly.use_smooth=True;seam=any(me.loops[k].vertex_index%N==N-1 for k in poly.loop_indices)
  for k in poly.loop_indices:
   vi=me.loops[k].vertex_index;i=vi%N;uv.data[k].uv=(1 if seam and i==0 else i/N,(profile[vi//N][1]-.006)/.103)
 return o
lathe('Printed seamless drawn body',[(.026,.004),(.027,.005),(.029,.007),(.031,.011),(.0325,.018),(.033,.022),(.033,.09),(.0328,.096),(.0318,.102),(.030,.108),(.029,.111),(.029,.113)],ink)
for z in [.003,.113]:
 lathe('Rolled aluminium rim',[(.0275,z),(.0288,z-.001),(.0297,z-.0006),(.030,z+.0002),(.0297,z+.001),(.0287,z+.0012),(.0275,z)],metal)
lathe('Recessed lid',[(0,.112),(.009,.112),(.025,.112),(.027,.1125),(.0285,.113)],metal)
lathe('Concave base',[(0,.0065),(.012,.0065),(.020,.0055),(.024,.002),(.026,.001),(.0275,.002),(.0285,.003)],metal)
def ovalring(name,cx,cy,z,rx,ry,width):
 # Rounded pull tab with a genuine opening, not painted on the lid.
 N=64;verts=[];faces=[]
 for zz in [z,z+.0007]:
  for shrink in [0,width]:
   for i in range(N):a=i*math.tau/N;verts.append((cx+(rx-shrink)*math.cos(a),cy+(ry-shrink)*math.sin(a),zz))
 for i in range(N):
  j=(i+1)%N
  faces.extend([(i,j,N+j,N+i),(2*N+i,3*N+i,3*N+j,2*N+j),(i,2*N+i,2*N+j,j),(N+i,N+j,3*N+j,3*N+i)])
 me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);me.materials.append(metal)
 bevel=o.modifiers.new('Soft stamped edges','BEVEL');bevel.width=.0002;bevel.segments=2;bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.modifier_apply(modifier=bevel.name);o.select_set(False)
 return o
ovalring('Pull tab finger opening',0,.003,.113,.0065,.012,.002)
ovalring('Scored opening channel',0,-.011,.1122,.009,.012,.00035)
lathe('Tab rivet',[(0,.113),(.0015,.113),(.0017,.1137),(0,.1142)],metal,32).location.y=-.003
# Geometry droplets joined into a single mesh/material to keep draw calls low.
rng=random.Random(330);drops=[]
for i in range(300):
 a=rng.uniform(-math.pi,math.pi);z=rng.uniform(.016,.099);r=rng.uniform(.00015,.00065)
 bpy.ops.mesh.primitive_uv_sphere_add(segments=8,ring_count=4,radius=1,location=(.033*math.cos(a),.033*math.sin(a),z));o=bpy.context.object;o.name='Condensation';o.rotation_euler=Vector((math.cos(a),math.sin(a),0)).to_track_quat('Z','Y').to_euler();o.scale=(r,r*rng.uniform(1,1.35),r*.55);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);drops.append(o)
bpy.ops.object.select_all(action='DESELECT')
for o in drops:o.select_set(True)
bpy.context.view_layer.objects.active=drops[0];bpy.ops.object.join();bpy.context.object.name='Condensation droplets';bpy.context.object.data.materials.append(water)
for o in bpy.context.scene.objects:
 if o.type=='MESH':
  for p in o.data.polygons:p.use_smooth=True
# Embed images for a self-contained GLB and editable source.
for image in bpy.data.images:
 if image.source=='FILE':image.pack()
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'assets/blender/products/cola-330ml.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT/'product.glb'),export_format='GLB',export_yup=True,export_apply=True,export_cameras=False,export_lights=False)
print('Exported',OUT/'product.glb')
