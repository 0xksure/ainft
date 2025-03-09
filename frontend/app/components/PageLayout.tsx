'use client';

import { FC, ReactNode, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Header from './Header';

interface PageLayoutProps {
    children: ReactNode;
}

const PageLayout: FC<PageLayoutProps> = ({ children }) => {
    // Track if we're on the client side for animations
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white overflow-x-hidden">
            <Header />

            {/* Conditionally render animations only on client-side */}
            {isClient ? (
                <motion.main
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-28"
                >
                    {children}
                </motion.main>
            ) : (
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-28">
                    {children}
                </main>
            )}

            {/* Animated background elements - only on client side */}
            {isClient && (
                <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.15 }}
                        transition={{ duration: 2 }}
                        className="absolute top-0 -left-40 w-80 h-80 bg-sky-500 rounded-full filter blur-3xl"
                    />
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.1 }}
                        transition={{ duration: 2, delay: 0.5 }}
                        className="absolute bottom-0 -right-40 w-96 h-96 bg-purple-600 rounded-full filter blur-3xl"
                    />
                </div>
            )}
        </div>
    );
};

export default PageLayout; 