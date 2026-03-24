
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

import { getFeaturedImoveis } from '@/lib/imoveis'

export async function GET() {
    try {
        const data = await getFeaturedImoveis(10)
        return NextResponse.json({ ok: true, count: data.length, data })
    } catch (err: any) {
        console.error('Server Error:', err)
        return NextResponse.json({ ok: false, error: err.message || 'Unknown error' }, { status: 500 })
    }
}
