"""PureGlow 400 ml original satin-plastic bottle with a real hinged dispensing closure.
Authoring guide: height .21 m, width .075 m, depth .045 m; unseen construction inferred.
"""
import bpy,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'public/products/personal-care/pureglow/400ml'
bpy.context.preferences.filepaths.save_version=0
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def mat(name,color,rough=.35,image=None):
 m=bpy.data.materials.new(name);m.use_nodes=True;m.use_backface_culling=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough
 if image:
  t=m.node_tree.nodes.new('ShaderNodeTexImage');t.image=bpy.data.images.load(str(OUT/image));m.node_tree.links.new(t.outputs['Color'],p.inputs['Base Color'])
 return m
bodymat=mat('PureGlow satin HDPE',(.045,.27,.52),.38);capmat=mat('PureGlow blue closure',(.025,.16,.38),.28);labelmat=mat('PureGlow printed labels',(1,1,1),.38,'front-back.png');barcodemat=mat('PureGlow catalogue EAN',(1,1,1),.42,'barcode.png');seammat=mat('Moulded seam',(.045,.24,.47),.42)
for m in [bodymat,labelmat]:
 for filename,socket in [('polymer-normal.png','Normal'),('polymer-roughness.png','Roughness')]:
  t=m.node_tree.nodes.new('ShaderNodeTexImage');t.image=bpy.data.images.load(str(ROOT/'public/textures/pbr'/filename));t.image.colorspace_settings.name='Non-Color';p=m.node_tree.nodes.get('Principled BSDF')
  if socket=='Normal':
   n=m.node_tree.nodes.new('ShaderNodeNormalMap');n.inputs['Strength'].default_value=.08;m.node_tree.links.new(t.outputs['Color'],n.inputs['Color']);m.node_tree.links.new(n.outputs['Normal'],p.inputs[socket])
  else:m.node_tree.links.new(t.outputs['Color'],p.inputs[socket])
def surface(name,rings,material,N=96,umin=0,umax=1,uvrange=(0,1),physicalV=False,rounded=False):
 vs=[];faces=[];uvrows=[]
 for w,d,z in rings:
  row=[]
  edge=min(z-rings[0][2],rings[-1][2]-z);span=.6+.4*math.sqrt(max(0,1-((.012-edge)/.012)**2)) if rounded and edge<.012 else 1
  start=(umin+umax)/2-(umax-umin)*span/2;end=(umin+umax)/2+(umax-umin)*span/2
  for i in range(N+1):
   a=-math.pi+(start+(end-start)*i/N)*math.tau;c=math.cos(a);s=math.sin(a);row.append((w*math.copysign(abs(c)**(2/3),c),d*math.copysign(abs(s)**(2/3),s),z))
  dist=[0]
  for a,b in zip(row,row[1:]):dist.append(dist[-1]+math.hypot(b[0]-a[0],b[1]-a[1]))
  uvrows.append([(uvrange[0]+uvrange[1])/2+(uvrange[1]-uvrange[0])*span*((d/dist[-1] if dist[-1] else i/N)-.5) for i,d in enumerate(dist)]);vs.extend(row)
 for j in range(len(rings)-1):
  for i in range(N):k=j*(N+1)+i;faces.append((k,k+1,k+N+2,k+N+1))
 me=bpy.data.meshes.new(name);me.from_pydata(vs,[],faces);me.update();o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);me.materials.append(material);uv=me.uv_layers.new(name='Arc-length packaging UV')
 for p in me.polygons:
  p.use_smooth=True
  for li in p.loop_indices:
   vi=me.loops[li].vertex_index;row=vi//(N+1);v=(rings[row][2]-rings[0][2])/(rings[-1][2]-rings[0][2]) if physicalV else row/(len(rings)-1);uv.data[li].uv=(uvrows[row][vi%(N+1)],v)
 return o
outer=[(0,0,.002),(.028,.016,.001),(.034,.020,.002),(.037,.022,.012),(.0375,.0225,.045),(.0365,.022,.085),(.033,.020,.125),(.029,.018,.150),(.026,.0175,.166),(.022,.016,.177),(.019,.0145,.181)]
inner=[(max(0,w-.001),max(0,d-.001),z+(.002 if z<.005 else 0)) for w,d,z in outer]
surface('PureGlowBottle',outer+list(reversed(inner)),bodymat,128)
def profile(z,offset=.00012):
 for a,b in zip(outer,outer[1:]):
  if a[2]<=z<=b[2]:
   t=(z-a[2])/(b[2]-a[2]);return (a[0]+(b[0]-a[0])*t+offset,a[1]+(b[1]-a[1])*t+offset,z)
 raise ValueError(z)
zs=[.030,.031,.033,.036,.040,.045,.065,.085,.105,.125,.138,.143,.147,.150,.152,.153]
front=surface('PureGlowFrontLabel',[profile(z) for z in zs],labelmat,48,.145,.355,(0,.5),True,True)
back=surface('PureGlowBackLabel',[profile(z) for z in zs],labelmat,48,.645,.855,(.5,1),True,True)
surface('PureGlowBarcode',[profile(z,.00025) for z in [.048,.064]],barcodemat,32,.70,.80,(0,1),True)
def box(name,loc,dimensions,material,bevel=.001):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=dimensions;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(material);b=o.modifiers.new('Injection moulded radius','BEVEL');b.width=bevel;b.segments=5;bpy.ops.object.modifier_apply(modifier=b.name);return o
base=box('PureGlowClosureBase',(0,0,.1895),(.052,.036,.019),capmat,.002)
# Boolean through-opening communicates with the hollow bottle neck.
bpy.ops.mesh.primitive_cylinder_add(vertices=64,radius=.0026,depth=.05,location=(0,-.008,.195));cutter=bpy.context.object;bpy.context.view_layer.objects.active=base;b=base.modifiers.new('Actual dispensing hole','BOOLEAN');b.operation='DIFFERENCE';b.object=cutter;bpy.ops.object.modifier_apply(modifier=b.name);bpy.data.objects.remove(cutter,do_unlink=True)
bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,radius=.005,location=(0,-.018,.201));cutter=bpy.context.object;bpy.context.view_layer.objects.active=base;b=base.modifiers.new('Thumb recess','BOOLEAN');b.operation='DIFFERENCE';b.object=cutter;bpy.ops.object.modifier_apply(modifier=b.name);bpy.data.objects.remove(cutter,do_unlink=True)
# Open nozzle is a ring, never a painted black circle.
nozzle=surface('PureGlowNozzle',[(.0046,.0046,.1985),(.0046,.0046,.2015),(.0026,.0026,.2015),(.0026,.0026,.1985)],capmat,64)
nozzle.location.y=-.008
# A round nozzle needs circular coordinates; the body/labels remain rounded rectangular.
for j,(r,_,z) in enumerate([(.0046,.0046,.1985),(.0046,.0046,.2015),(.0026,.0026,.2015),(.0026,.0026,.1985)]):
 for i in range(65):a=-math.pi+i*math.tau/64;nozzle.data.vertices[j*65+i].co=(r*math.cos(a),r*math.sin(a),z)
nozzle.data.update()
pivot=bpy.data.objects.new('FlipTopLidPivot',None);bpy.context.collection.objects.link(pivot);pivot.location=(0,.017,.198);pivot.empty_display_size=.008
lid=surface('PureGlowFlipLid',[(.027,.0195,.201),(.0275,.0198,.203),(.0268,.0195,.2095),(0,0,.210),(0,0,.207),(.0245,.0165,.2065),(.0245,.0165,.201),(.027,.0195,.201)],capmat,96)
bpy.ops.mesh.primitive_cylinder_add(vertices=48,radius=.0022,depth=.009,location=(0,-.008,.2025));plug=bpy.context.object;plug.name='PureGlowSealingPlug';plug.data.materials.append(capmat);b=plug.modifiers.new('Rounded stopper tip','BEVEL');b.width=.0005;b.segments=3;bpy.ops.object.modifier_apply(modifier=b.name)
thumb=box('PureGlowThumbLip',(0,-.020,.203),(.012,.006,.003),capmat,.001)
for o in [lid,plug,thumb]:o.location.z-=.002
bpy.context.view_layer.update()
for o in [lid,plug,thumb]:
 world=o.matrix_world.copy();o.parent=pivot;o.matrix_world=world
for x in [-.006,.006]:box('Flexible living hinge',(x,.018,.198),(.004,.006,.0015),capmat,.0005)
# Subtle side mould parting lines and recessed base rim.
for side in [-1,1]:
 curve=bpy.data.curves.new('Body mould seam','CURVE');curve.dimensions='3D';curve.bevel_depth=.00008;curve.bevel_resolution=1;spline=curve.splines.new('POLY');points=[(side*w,0,z) for w,d,z in outer[3:]];spline.points.add(len(points)-1)
 for point,co in zip(spline.points,points):point.co=(*co,1)
 o=bpy.data.objects.new('Body mould seam',curve);bpy.context.collection.objects.link(o);o.data.materials.append(seammat);bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH')
# Merge only fixed details; preserve the moving pivot and its children.
fixed=[o for o in bpy.context.scene.objects if o.type=='MESH' and o.parent is None and len(o.data.materials)==1 and o.data.materials[0]==capmat]
if len(fixed)>1:
 bpy.ops.object.select_all(action='DESELECT')
 for o in fixed:o.select_set(True)
 bpy.context.view_layer.objects.active=base;bpy.ops.object.join();bpy.context.object.name='PureGlowClosureBase'
for image in bpy.data.images:
 if image.source=='FILE':image.pack()
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'assets/blender/products/pureglow-shampoo-400ml.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT/'product.glb'),export_format='GLB',export_yup=True,export_apply=True,export_cameras=False,export_lights=False)
print('Exported PureGlow 400 ml GLB with FlipTopLidPivot')
