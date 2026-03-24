
'use client'

import { createImovel } from '../actions'

export default function NovoImovelPage() {
    return (
        <div className="container" style={{ padding: '2rem 1rem', maxWidth: '800px' }}>
            <h1 style={{ marginBottom: '2rem' }}>Cadastrar Novo Imóvel</h1>

            <form action={createImovel} style={{ display: 'grid', gap: '1.5rem' }}>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                    <label>Nome do Imóvel</label>
                    <input required name="nome" type="text" style={inputStyle} placeholder="Ex: Casa no Cambuí" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                        <label>Preço (R$)</label>
                        <input required name="preco_base" type="number" step="0.01" style={inputStyle} />
                    </div>
                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                        <label>URL da Imagem</label>
                        <input required name="imagens_urls" type="url" style={inputStyle} placeholder="https://..." />
                    </div>
                </div>

                <div style={{ display: 'grid', gap: '0.5rem' }}>
                    <label>Descrição</label>
                    <textarea required name="descricao" rows={4} style={inputStyle}></textarea>
                </div>

                <div style={{ padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Detalhes</h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            <label>Tipo</label>
                            <select name="tipo_imovel" style={inputStyle}>
                                <option value="casa">Casa</option>
                                <option value="apartamento">Apartamento</option>
                                <option value="terreno">Terreno</option>
                            </select>
                        </div>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            <label>Finalidade</label>
                            <select name="finalidade" style={inputStyle}>
                                <option value="venda">Venda</option>
                                <option value="locacao">Locação</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.9rem' }}>Dorm.</label>
                            <input name="dormitorios" type="number" style={inputStyle} />
                        </div>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.9rem' }}>Banh.</label>
                            <input name="banheiros" type="number" style={inputStyle} />
                        </div>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.9rem' }}>Vagas</label>
                            <input name="vagas" type="number" style={inputStyle} />
                        </div>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.9rem' }}>Área (m²)</label>
                            <input name="area_total" type="number" style={inputStyle} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            <label>Cidade</label>
                            <input name="cidade" type="text" style={inputStyle} />
                        </div>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            <label>Estado</label>
                            <input name="estado" type="text" style={inputStyle} maxLength={2} />
                        </div>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            <label>Bairro</label>
                            <input name="bairro" type="text" style={inputStyle} />
                        </div>
                    </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                    Cadastrar Imóvel
                </button>
            </form>
        </div>
    )
}

const inputStyle = {
    padding: '0.75rem',
    borderRadius: '0.5rem',
    border: '1px solid #cbd5e1',
    width: '100%',
    fontFamily: 'inherit'
}
