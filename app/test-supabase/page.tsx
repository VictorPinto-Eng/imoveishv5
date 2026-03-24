
import { supabase } from '@/lib/supabaseClient'

export const dynamic = 'force-dynamic'

export default async function TestSupabasePage() {
    const { data, error } = await supabase
        .from('produtos_servicos')
        .select('*')
        .limit(5)

    return (
        <div className="p-8 font-sans">
            <h1 className="text-2xl font-bold mb-4">Teste Supabase</h1>

            {error ? (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <p className="font-bold">Erro:</p>
                    <p>{error.message}</p>
                    {error.code === '42501' && ( // Permission denied / RLS
                        <p className="mt-2 text-sm">
                            ⚠️ RLS do Supabase está bloqueando SELECT na tabela <code>produtos_servicos</code> para o role anon.
                            É necessário ajustar as policies diretamente no painel do Supabase.
                        </p>
                    )}
                </div>
            ) : (
                <div>
                    <p className="mb-4 text-green-700 font-semibold">
                        Registros retornados: {data?.length ?? 0}
                    </p>
                    <pre className="bg-gray-100 p-4 rounded overflow-auto border border-gray-300 text-sm">
                        {JSON.stringify(data, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    )
}
