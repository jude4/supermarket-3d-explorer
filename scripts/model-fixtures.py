import bpy
from pathlib import Path
from math import pi
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
def mat(name, color, metallic=0, roughness=.4):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value=(*color,1); p.inputs['Metallic'].default_value=metallic; p.inputs['Roughness'].default_value=roughness
    return m
white=mat('Porcelain powder coat',(.79,.81,.76),.25)
graphite=mat('Satin graphite steel',(.14,.19,.17),.65)
oak=mat('Warm oak end panels',(.55,.40,.25),.05,.6)
def box(name, loc, scale, material, bevel=.025):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc); o=bpy.context.object; o.name=name; o.dimensions=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(material)
    mod=o.modifiers.new('Manufactured edge radius','BEVEL'); mod.width=bevel; mod.segments=3
    o.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL')
    bpy.context.view_layer.objects.active=o
    for mod in list(o.modifiers): bpy.ops.object.modifier_apply(modifier=mod.name)
# Blender Z-up, length along Y. Export produces glTF Y-up automatically.
box('Recessed plinth',(0,0,.09),(1.05,4.8,.18),graphite)
box('Central spine',(0,0,.88),(.07,4.7,1.55),white)
for y in [-2.3,0,2.3]:
    box('Slotted steel upright',(0,y,.9),(.095,.09,1.8),graphite,.012)
    for z in [.3,.58,.86,1.14,1.42,1.7]:
        box('Mounting slot',(.05,y,z),(.008,.035,.065),graphite,.003)
for z in [.24,.61,.98,1.35,1.72]:
    box('Folded metal shelf',(0,0,z),(1.24,4.85,.045),white,.018)
    for x in [-.61,.61]: box('Rolled shelf edge',(x,0,z+.015),(.035,4.84,.055),white,.012)
for y in [-2.46,2.46]:
    box('Oak end cap',(0,y,.89),(1.25,.065,1.8),oak,.025)
    box('Steel end reveal',(0,y*1.016,.89),(.055,.018,1.7),graphite,.007)
# Merge by material into three reusable geometries, with identity transforms.
for material in [white,graphite,oak]:
    bpy.ops.object.select_all(action='DESELECT')
    objects=[o for o in bpy.context.scene.objects if o.type=='MESH' and o.data.materials[0]==material]
    for o in objects: o.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]; bpy.ops.object.join()
    o=bpy.context.object; o.name=material.name
    bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
bpy.ops.export_scene.gltf(filepath=str(Path(__file__).resolve().parent.parent/'public/models/empty-gondola.glb'),export_format='GLB',export_yup=True)
