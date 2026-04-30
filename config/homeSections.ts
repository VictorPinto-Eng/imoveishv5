/**
 * Configuração das seções de imóveis da página principal.
 * 
 * Para adicionar, remover ou reordenar seções, edite este arquivo.
 * Cada seção é exibida apenas se tiver pelo menos 1 imóvel disponível.
 */

export interface HomeSectionConfig {
  id: string
  title: string
  subtitle: string
  /** Quantos imóveis exibir nesta seção */
  limit: number
  /** Se false, a seção fica oculta sem remover do código */
  enabled: boolean
}

export const HOME_SECTIONS: HomeSectionConfig[] = [
  {
    id: 'destaques',
    title: 'Imóveis em Destaque',
    subtitle: 'Conheça nossas melhores oportunidades',
    limit: 6,
    enabled: true,
  },
  {
    id: 'recentes',
    title: 'Recém Cadastrados',
    subtitle: 'As novidades que acabaram de chegar',
    limit: 6,
    enabled: true,
  },
  {
    id: 'oportunidades',
    title: 'Oportunidades — Preço Atualizado',
    subtitle: 'Imóveis com condições revisadas para você fechar negócio',
    limit: 6,
    enabled: true,
  },
]
