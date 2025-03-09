import type { AppProps } from 'next/app';
import '../app/globals.css';
import WalletContextProvider from '../app/contexts/WalletContextProvider';

export default function MyApp({ Component, pageProps }: AppProps) {
    return (
        <WalletContextProvider>
            <Component {...pageProps} />
        </WalletContextProvider>
    );
} 