'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center text-center">
      <motion.div 
        className="space-y-6 max-w-3xl mx-auto px-4"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <motion.h1 
          className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400 animate-float"
          variants={fadeInUp}
        >
          Welcome to Shadow Coach AI
        </motion.h1>
        <motion.p 
          className="text-xl text-gray-600 dark:text-gray-300"
          variants={fadeInUp}
        >
          Your personal AI-powered coaching platform for achieving your goals and maximizing potential.
        </motion.p>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12"
          variants={fadeInUp}
        >
          <Link 
            href="/admin/dashboard"
            className="cursor-pointer group p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700"
          >
            <div className="text-blue-500 text-2xl mb-4">👑</div>
            <h2 className="text-xl font-semibold mb-2 group-hover:text-blue-500 transition-colors">Admin Portal</h2>
            <p className="text-gray-600 dark:text-gray-300">Manage organizations and users</p>
          </Link>
          
          <Link 
            href="/coach/dashboard"
            className="cursor-pointer group p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700"
          >
            <div className="text-emerald-500 text-2xl mb-4">🎯</div>
            <h2 className="text-xl font-semibold mb-2 group-hover:text-emerald-500 transition-colors">Coach Portal</h2>
            <p className="text-gray-600 dark:text-gray-300">Guide and support your clients</p>
          </Link>
          
          <Link 
            href="/client/dashboard"
            className="cursor-pointer group p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700"
          >
            <div className="text-blue-500 text-2xl mb-4">🌟</div>
            <h2 className="text-xl font-semibold mb-2 group-hover:text-blue-500 transition-colors">Client Portal</h2>
            <p className="text-gray-600 dark:text-gray-300">Track progress and attend sessions</p>
          </Link>
        </motion.div>
        
        <motion.div 
          className="mt-12 flex flex-col items-center space-y-4"
          variants={fadeInUp}
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">New to Shadow Coach AI?</p>
          <div className="flex space-x-4">
            <Link
              href="/auth/register"
              className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors flex items-center space-x-2"
            >
              <span>Get Started</span>
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
            <Link
              href="/auth/login"
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
} 