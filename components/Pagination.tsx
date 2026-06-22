'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import styles from './Pagination.module.css'

interface PaginationProps {
    currentPage: number
    totalPages: number
}

export default function Pagination({ currentPage, totalPages }: PaginationProps) {
    const searchParams = useSearchParams()
    const router = useRouter()

    function goToPage(page: number) {
        const params = new URLSearchParams(searchParams.toString())
        params.set('page', page.toString())
        router.push(`/imoveis?${params.toString()}`)
    }

    // Gera array de páginas visíveis (max 7)
    function getVisiblePages(): (number | '...')[] {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1)
        }

        if (currentPage <= 4) {
            return [1, 2, 3, 4, 5, '...', totalPages]
        }

        if (currentPage >= totalPages - 3) {
            return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
        }

        return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages]
    }

    const pages = getVisiblePages()

    return (
        <nav className={styles.pagination} aria-label="Paginação">
            <button
                className={styles.btn}
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Página anterior"
            >
                ‹
            </button>

            {pages.map((page, idx) =>
                page === '...' ? (
                    <span key={`dots-${idx}`} className={styles.dots}>…</span>
                ) : (
                    <button
                        key={page}
                        className={`${styles.btn} ${page === currentPage ? styles.active : ''}`}
                        onClick={() => goToPage(page)}
                        aria-current={page === currentPage ? 'page' : undefined}
                    >
                        {page}
                    </button>
                )
            )}

            <button
                className={styles.btn}
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Próxima página"
            >
                ›
            </button>
        </nav>
    )
}