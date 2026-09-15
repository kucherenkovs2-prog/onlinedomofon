tailwind.config = {
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                display: ['Inter', 'sans-serif'],
            },
            colors: {
                brand: {
                    dark: '#1e2022', 
                    primary: '#0b57d0', 
                    primaryHover: '#0842a0',
                    secondary: '#f8f9fa', 
                    accent: '#00639b', 
                    surface: '#f1f3f4',
                    surfaceVariant: '#e9eef6', 
                    border: '#dadce0', 
                    success: '#1e8e3e',
                    warning: '#f9ab00', 
                    danger: '#d93025'
                }
            },
            boxShadow: {
                'g-card': '0 1px 3px 0 rgba(60,64,67,0.08), 0 4px 8px 3px rgba(60,64,67,0.04)',
                'g-hover': '0 2px 6px 0 rgba(60,64,67,0.15), 0 8px 24px 4px rgba(60,64,67,0.08)',
                'g-modal': '0 12px 32px 0 rgba(60,64,67,0.2)',
            },
            animation: {
                'float': 'float 6s ease-in-out infinite',
                'fade-in': 'fadeIn 0.3s cubic-bezier(0.2, 0, 1) forwards',
            },
            keyframes: {
                float: { 
                    '0%, 100%': { transform: 'translateY(0)' }, 
                    '50%': { transform: 'translateY(-12px)' } 
                },
                fadeIn: { 
                    '0%': { opacity: '0', transform: 'translateY(6px)' }, 
                    '100%': { opacity: '1', transform: 'translateY(0)' } 
                }
            }
        }
    }
};