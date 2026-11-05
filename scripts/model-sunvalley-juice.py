"""SunValley 1 L original rounded-rectangular PET packaging, metres.
References establish design intent; unseen construction and liquid volume are not measured.
"""
import bpy,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'public/products/beverages/sunvalley/1l'
bpy.context.preferences.filepaths.save_version=0
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def mat(name,color,rough=.3,trans=0,ior=1.46):
 m=bpy.data.materials.new(name);m.use_nodes=True;m.use_backface_culling=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough;p.inputs['Transmission Weight'].default_value=trans;p.inputs['IOR'].default_value=ior;return m
pet=mat('Clear PET juice shell',(.99,1,1),.04,1,1.57);juice=mat('Translucent orange juice',(.95,.42,.008),.2,.09,1.34);cap=mat('Orange HDPE closure',(.96,.19,.006),.28);label=mat('SunValley printed sleeve',(1,1,1),.34);barcode=mat('Catalogue EAN-13',(1,1,1),.42)
for material,file in [(label,'wrap-label.png'),(barcode,'barcode.png')]:
 p=material.node_tree.nodes.get('Principled BSDF');t=material.node_tree.nodes.new('ShaderNodeTexImage');t.image=bpy.data.images.load(str(OUT/file));material.node_tree.links.new(t.outputs['Color'],p.inputs['Base Color'])
for file,socket in [('polymer-normal.png','Normal'),('polymer-roughness.png','Roughness')]:
 t=label.node_tree.nodes.new('ShaderNodeTexImage');t.image=bpy.data.images.load(str(ROOT/'public/textures/pbr'/file));t.image.colorspace_settings.name='Non-Color';p=label.node_tree.nodes.get('Principled BSDF')
 if socket=='Normal':
  n=label.node_tree.nodes.new('ShaderNodeNormalMap');n.inputs['Strength'].default_value=.10;label.node_tree.links.new(t.outputs['Color'],n.inputs['Color']);label.node_tree.links.new(n.outputs['Normal'],p.inputs[socket])
 else:label.node_tree.links.new(t.outputs['Color'],p.inputs[socket])
def surface(name,rings,material,N=128,umin=0,umax=1,base=False,physicalV=False):
 vs=[];faces=[]
 for w,d,z,power in rings:
  for i in range(N+1):
   u=umin+(umax-umin)*i/N;a=-math.pi+u*math.tau;c=math.cos(a);s=math.sin(a);height=z
   if base and z<.014 and w>.02:height+=.0008*(1+math.cos(4*a))*(1-z/.014)
   vs.append((w*math.copysign(abs(c)**(2/power),c),d*math.copysign(abs(s)**(2/power),s),height))
 for j in range(len(rings)-1):
  for i in range(N):k=j*(N+1)+i;faces.append((k,k+1,k+N+2,k+N+1))
 me=bpy.data.meshes.new(name);me.from_pydata(vs,[],faces);me.update();o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);me.materials.append(material);uv=me.uv_layers.new(name='Continuous wrap UV')
 # Arc-length UVs prevent text stretching at the flat faces of a superellipse.
 uvs=[]
 for j in range(len(rings)):
  row=vs[j*(N+1):(j+1)*(N+1)];dist=[0]
  for a,b in zip(row,row[1:]):dist.append(dist[-1]+math.hypot(b[0]-a[0],b[1]-a[1]))
  length=dist[-1];uvs.append([v/length if length else i/N for i,v in enumerate(dist)])
 for p in me.polygons:
  p.use_smooth=True
  for li in p.loop_indices:
   vi=me.loops[li].vertex_index;row=vi//(N+1);v=(rings[row][2]-rings[0][2])/(rings[-1][2]-rings[0][2]) if physicalV else row/(len(rings)-1);uv.data[li].uv=(uvs[row][vi%(N+1)],v)
 return o
outer=[(0,0,.006,3.5),(.020,.018,.005,3.5),(.036,.031,.001,3.5),(.041,.036,.003,3.5),(.0425,.0375,.009,3.5),(.0425,.0375,.025,3.5),(.0418,.0368,.045,3.5),(.0405,.0358,.070,3.5),(.0405,.0358,.125,3.5),(.0425,.0375,.160,3.5),(.0425,.0375,.177,3.5),(.0418,.0368,.188,3.4),(.038,.033,.199,3.1),(.030,.026,.211,2.8),(.020,.019,.221,2.3),(.0155,.0155,.226,2),(.0155,.0155,.236,2)]
inner=[(max(0,w-.0006),max(0,d-.0006),z+(.0007 if z<.007 else 0),n) for w,d,z,n in outer]
surface('SunValley PET shell',outer+list(reversed(inner)),pet,160,base=True)
liquid=[(w-.001,d-.001,z+.001,n) for w,d,z,n in outer[1:13]];liquid=[(0,0,.008,3.5)]+liquid+[(.033,.028,.199,3.1),(0,0,.1986,3.1)];surface('SunValley orange fill',liquid,juice,128)
def profile(z,offset=0):
 for a,b in zip(outer,outer[1:]):
  if a[2]<=z<=b[2]:
   t=(z-a[2])/(b[2]-a[2]);return (a[0]+(b[0]-a[0])*t+offset,a[1]+(b[1]-a[1])*t+offset,z,3.5)
 raise ValueError(z)
surface('SunValley wrap label',[profile(z,.0002) for z in [.052,.065,.085,.11,.135,.155]],label,160,physicalV=True)
surface('SunValley barcode',[profile(z,.0004) for z in [.058,.078]],barcode,24,.695,.805,physicalV=True)
# Ribbed moulded cap, top disk, screw-neck rings and tamper band.
parts=[]
def cylinder(name,r,depth,z,material):
 bpy.ops.mesh.primitive_cylinder_add(vertices=96,radius=r,depth=depth,location=(0,0,z));o=bpy.context.object;o.name=name;o.data.materials.append(material);b=o.modifiers.new('Moulded edge bevel','BEVEL');b.width=.00035;b.segments=3;bpy.ops.object.modifier_apply(modifier=b.name)
 for p in o.data.polygons:p.use_smooth=len(p.vertices)==4
 parts.append(o);return o
cylinder('Tamper evident ring',.0178,.002,.234,cap);cylinder('Orange screw cap',.018,.013,.2425,cap);cylinder('Recessed cap top',.0165,.0004,.2493,cap)
for i in range(80):
 a=i*math.tau/80;bpy.ops.mesh.primitive_cube_add(size=1,location=(.018*math.cos(a),.018*math.sin(a),.2427));o=bpy.context.object;o.name='Cap grip flute';o.dimensions=(.00055,.00055,.0105);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(cap);b=o.modifiers.new('Rounded grip','BEVEL');b.width=.00018;b.segments=2;bpy.ops.object.modifier_apply(modifier=b.name);parts.append(o)
bpy.ops.object.select_all(action='DESELECT')
for o in parts:o.select_set(True)
bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();bpy.context.object.name='SunValley ribbed closure'
for z in [.228,.231]:
 bpy.ops.mesh.primitive_torus_add(major_radius=.0157,minor_radius=.0004,major_segments=64,minor_segments=8,location=(0,0,z));bpy.context.object.name='PET neck retaining ring';bpy.context.object.data.materials.append(pet)
for image in bpy.data.images:
 if image.source=='FILE':image.pack()
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'assets/blender/products/sunvalley-orange-juice-1l.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT/'product.glb'),export_format='GLB',export_yup=True,export_apply=True,export_cameras=False,export_lights=False)
print('Exported SunValley juice GLB')
