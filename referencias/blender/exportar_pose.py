# Exporta a pose atual do esqueleto do Luffy (Blender) para o formato .pose que
# o projeto lê (utils/pose.js). Como usar:
#   1. abra o .blend do Luffy, faça a pose no Pose Mode
#   2. aba Scripting -> Text -> Open -> este arquivo -> Run Script (Alt+P)
#   3. ajuste NOME_DO_ARQUIVO abaixo para pose1.pose, pose2.pose ou pose3.pose
#
# Conta feita: no projeto, cada osso tem uma rotação R nos eixos do mundo (o modelo
# XPS não tem orientação nos ossos). Para cada osso, a matriz de deformação
# D = pose * repouso^-1 leva o vértice do bind até a pose. A rotação local do osso
# é a parte de rotação de D_pai^-1 * D_osso. Depois convertemos do sistema do
# Blender (Z para cima) para o do modelo (Y para cima).

import bpy
from mathutils import Matrix

NOME_DO_ARQUIVO = 'pose1.pose'
PASTA = '/home/sope/Desktop/faculdade/cg/tp02/tp02_PedroHSoares_Bryan/assets/poses/'

# XPS (x, y, z) -> Blender (x, -z, y)
XPS_PARA_BLENDER = Matrix(((1, 0, 0, 0), (0, 0, -1, 0), (0, 1, 0, 0), (0, 0, 0, 1)))
BLENDER_PARA_XPS = XPS_PARA_BLENDER.inverted()

armadura = next((obj for obj in bpy.context.scene.objects if obj.type == 'ARMATURE'), None)
if armadura is None:
    raise RuntimeError('Nenhum esqueleto (Armature) encontrado na cena')

mundo = armadura.matrix_world


def deformacao(osso_pose):
    # deformação no espaço do mundo do Blender e depois no do modelo
    d = mundo @ osso_pose.matrix @ osso_pose.bone.matrix_local.inverted() @ mundo.inverted()
    return BLENDER_PARA_XPS @ d @ XPS_PARA_BLENDER


linhas = []
for osso in armadura.pose.bones:
    d = deformacao(osso)
    d_pai = deformacao(osso.parent) if osso.parent else Matrix.Identity(4)
    rotacao = (d_pai.inverted() @ d).to_3x3().normalized()
    # 'YXZ': aplica Y, depois X, depois Z (mesma ordem de utils/pose.js)
    angulos = rotacao.to_euler('YXZ')
    graus = [a * 180 / 3.141592653589793 for a in angulos]
    if max(abs(g) for g in graus) < 0.01:
        continue
    linhas.append(f'{osso.name}: {graus[0]:.4f} {graus[1]:.4f} {graus[2]:.4f} 0 0 0 1 1 1')

with open(PASTA + NOME_DO_ARQUIVO, 'w', encoding='utf-8') as arquivo:
    arquivo.write('\n'.join(linhas) + '\n')

# conferência: posição de repouso da mão esquerda no sistema do modelo.
# No arquivo .xps ela é (1.355, 0.913, -0.128)
mao = armadura.pose.bones.get('Bip001 L Hand')
if mao:
    cabeca = BLENDER_PARA_XPS @ (mundo @ mao.bone.head_local).to_4d()
    print('Conferência Bip001 L Hand:', [round(v, 3) for v in cabeca[:3]])
print(f'{len(linhas)} ossos salvos em {PASTA + NOME_DO_ARQUIVO}')
