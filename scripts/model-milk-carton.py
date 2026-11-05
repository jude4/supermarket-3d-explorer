"""Original one-litre gable carton geometry; estimated proportions, not a measured scan.
Requires approved/generated flat artwork.png beside the output GLB.
"""
import bpy,math
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'public/products/dairy/whole-milk/1l';OUT.mkdir(parents=True,exist_ok=True)
bpy.context.preferences.filepaths.save_version=0
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def material(name,color,rough=.4):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough;return m
paper=material('Printed coated paperboard',(1,1,1),.43);p=paper.node_tree.nodes.get('Principled BSDF');p.inputs['Coat Weight'].default_value=.22;p.inputs['Coat Roughness'].default_value=.3
tex=paper.node_tree.nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(OUT/'artwork.png'));paper.node_tree.links.new(tex.outputs['Color'],p.inputs['Base Color'])
for file,socket in [('paper-normal.png','Normal'),('paper-roughness.png','Roughness')]:
 t=paper.node_tree.nodes.new('ShaderNodeTexImage');t.image=bpy.data.images.load(str(ROOT/'public/textures/pbr'/file));t.image.colorspace_settings.name='Non-Color'
 if socket=='Normal':
  n=paper.node_tree.nodes.new('ShaderNodeNormalMap');n.inputs['Strength'].default_value=.12;paper.node_tree.links.new(t.outputs['Color'],n.inputs['Color']);paper.node_tree.links.new(n.outputs['Normal'],p.inputs[socket])
 else:paper.node_tree.links.new(t.outputs['Color'],p.inputs[socket])
blue=material('Blue coated gable',(.008,.065,.48),.36);white=material('Heat sealed paper folds',(.89,.90,.91),.64);capmat=material('White HDPE closure',(.93,.94,.95),.3);edge=material('Scored fold edges',(.68,.74,.81),.6)
def mesh(name,verts,faces,mat,uvs=None):
 me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);me.materials.append(mat)
 if uvs:
  uv=me.uv_layers.new(name='Face artwork UV')
  for poly,coords in zip(me.polygons,uvs):
   for li,co in zip(poly.loop_indices,coords):uv.data[li].uv=co
 return o
def box(name,loc,dim,mat,bevel=.0003):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=dim;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(mat)
 if bevel:
  b=o.modifiers.new('Rounded manufactured edges','BEVEL');b.width=bevel;b.segments=3;bpy.ops.object.modifier_apply(modifier=b.name)
 return o
def line(name,points,mat,r=.00012):
 curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.bevel_depth=r;curve.bevel_resolution=2;sp=curve.splines.new('POLY');sp.points.add(len(points)-1)
 for p,co in zip(sp.points,points):p.co=(*co,1)
 o=bpy.data.objects.new(name,curve);bpy.context.collection.objects.link(o);o.data.materials.append(mat);return o
# Four separate UV islands share one embedded atlas. Front faces GLB +Z.
w=.0365;z0=.0015;z1=.205;ridge=.233
verts=[(-w,-w,z0),(w,-w,z0),(w,w,z0),(-w,w,z0),(-w,-w,z1),(w,-w,z1),(w,w,z1),(-w,w,z1)]
faces=[(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]
uvs=[[(i/4,0),((i+1)/4,0),((i+1)/4,1),(i/4,1)] for i in range(4)]
body=mesh('Milk carton printed body',verts,faces,paper,uvs)
bpy.context.view_layer.objects.active=body
bev=body.modifiers.new('Soft paperboard corners','BEVEL');bev.width=.00055;bev.segments=3;bpy.ops.object.modifier_apply(modifier=bev.name)
# Front/back roof slopes, folded triangular side gussets and standing sealed fin.
mesh('Front sloping gable',[(-w,-w,z1),(w,-w,z1),(w,0,ridge),(-w,0,ridge)],[(0,1,2,3)],blue)
mesh('Back sloping gable',[(w,w,z1),(-w,w,z1),(-w,0,ridge),(w,0,ridge)],[(0,1,2,3)],blue)
for s in [-1,1]:
 vs=[(s*w,-w,z1),(s*w,w,z1),(s*w,0,ridge-.001)];mesh('Inset folded side gusset',vs,[(0,1,2) if s>0 else (2,1,0)],blue)
 line('Gusset scored fold',[(s*(w+.00005),-w,z1),(s*(w+.00005),0,ridge-.001),(s*(w+.00005),w,z1)],edge,.00008)
box('Heat sealed top fin',(0,0,.2375),(.073,.0016,.009),white,.00045)
for zz in [.2348,.237,.2392]:line('Fin press crease',[(-.035,-.00085,zz),(.035,-.00085,zz)],edge,.00006)
# Glue overlap on the rear-right corner, not a painted line.
box('Rear glued overlap',(w-.002,w+.00012,.103),(.004,.00023,.201),blue,.00008)
# Folded bottom: four triangular layers with visible seams.
mesh('Bottom folded paperboard',[(-w,-w,z0),(w,-w,z0),(w,w,z0),(-w,w,z0),(0,0,.0007)],[(0,4,1),(1,4,2),(2,4,3),(3,4,0)],white)
for x,y in [(-w,-w),(w,-w),(w,w),(-w,w)]:line('Bottom fold seam',[(x,y,.0011),(0,0,.00065)],edge,.00012)
# Cap group oriented to the actual front sloped roof; ribs are real geometry.
normal=Vector((0,-(ridge-z1),w)).normalized();center=Vector((.006,-.017,.2188));rotation=normal.to_track_quat('Z','Y')
parts=[]
def cylinder(name,r,depth,offset,mat,vertices=96):
 loc=center+normal*offset;bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=r,depth=depth,location=loc);o=bpy.context.object;o.name=name;o.rotation_euler=rotation.to_euler();o.data.materials.append(mat);be=o.modifiers.new('Injection moulded edge','BEVEL');be.width=.00035;be.segments=3;bpy.ops.object.modifier_apply(modifier=be.name)
 for p in o.data.polygons:p.use_smooth=len(p.vertices)==4
 parts.append(o);return o
cylinder('Closure flange',.014,.0015,.0007,capmat);cylinder('Tamper evident ring',.0128,.0017,.0021,capmat);cylinder('Screw cap',.0125,.0075,.0065,capmat);cylinder('Cap top recessed disk',.0115,.0003,.01045,capmat)
for i in range(72):
 a=i*math.tau/72;local=Vector((.01255*math.cos(a),.01255*math.sin(a),.0063));pos=center+rotation@local;o=box('Closure grip rib',pos,(.00055,.00055,.0063),capmat,.00015);o.rotation_euler=rotation.to_euler();parts.append(o)
bpy.ops.object.select_all(action='DESELECT')
for o in parts:o.select_set(True)
bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();bpy.context.object.name='Ribbed screw closure assembly'
# Convert crease curves for interoperable GLB output.
for o in list(bpy.context.scene.objects):
 if o.type=='CURVE':
  bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH')
# Merge fixed details by material, retaining face UVs and the labelled body.
for mat in [blue,white,capmat,edge]:
 objects=[o for o in bpy.context.scene.objects if o.type=='MESH' and len(o.data.materials)==1 and o.data.materials[0]==mat]
 if len(objects)>1:
  bpy.ops.object.select_all(action='DESELECT')
  for o in objects:o.select_set(True)
  bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();bpy.context.object.name=mat.name+' details'
for image in bpy.data.images:
 if image.source=='FILE':image.pack()
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'assets/blender/products/whole-milk-1l.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT/'product.glb'),export_format='GLB',export_yup=True,export_apply=True,export_cameras=False,export_lights=False)
print('Exported milk GLB')
