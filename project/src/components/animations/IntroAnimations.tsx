import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Film } from 'lucide-react';
import type { IntroAnimationType } from '../../types/animations';

interface IntroAnimationsProps {
  type: IntroAnimationType;
  title: string;
  subtitle: string;
  onComplete: () => void;
}

const IntroAnimations: React.FC<IntroAnimationsProps> = ({
  type,
  title,
  subtitle,
  onComplete
}) => {
  // Effetto Sipario
  const curtainAnimation = {
    container: {
      initial: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 1 }
    },
    curtainLeft: {
      initial: { scaleX: 1, transformOrigin: 'left' },
      animate: { scaleX: 0 },
      transition: { duration: 2, delay: 2, ease: [0.22, 1, 0.36, 1] }
    },
    curtainRight: {
      initial: { scaleX: 1, transformOrigin: 'right' },
      animate: { scaleX: 0 },
      transition: { duration: 2, delay: 2, ease: [0.22, 1, 0.36, 1] }
    },
    content: {
      initial: { scale: 0.8, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      transition: { delay: 0.5 }
    }
  };

  // Effetto Dissolvenza
  const fadeAnimation = {
    container: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 1.5 }
    },
    content: {
      initial: { y: 20, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      transition: { delay: 0.5, duration: 0.8 }
    }
  };

  // Effetto Scorrimento
  const slideAnimation = {
    container: {
      initial: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 1 }
    },
    content: {
      initial: { x: '-100%', opacity: 0 },
      animate: { x: 0, opacity: 1 },
      transition: { type: 'spring', damping: 20, stiffness: 100 }
    }
  };

  React.useEffect(() => {
    const timer = setTimeout(onComplete, 4000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  // Effetto Sipario
  if (type === 'curtain') {
    return (
      <motion.div
        {...curtainAnimation.container}
        className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden"
      >
        {/* Sipario Sinistro */}
        <motion.div 
          {...curtainAnimation.curtainLeft}
          className="absolute top-0 left-0 w-1/2 h-full bg-[--theater-red]"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                to bottom,
                transparent 0px,
                transparent 20px,
                rgba(0, 0, 0, 0.2) 20px,
                rgba(0, 0, 0, 0.2) 40px
              ),
              repeating-linear-gradient(
                to right,
                rgba(0, 0, 0, 0) 0px,
                rgba(0, 0, 0, 0.1) 50px,
                rgba(0, 0, 0, 0) 100px
              )
            `,
            backgroundSize: '100% 40px, 200px 100%'
          }}
        >
          <div className="absolute top-0 right-0 w-12 h-full bg-gradient-to-l from-black/40 to-transparent" />
        </motion.div>

        {/* Sipario Destro */}
        <motion.div 
          {...curtainAnimation.curtainRight}
          className="absolute top-0 right-0 w-1/2 h-full bg-[--theater-red]"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                to bottom,
                transparent 0px,
                transparent 20px,
                rgba(0, 0, 0, 0.2) 20px,
                rgba(0, 0, 0, 0.2) 40px
              ),
              repeating-linear-gradient(
                to right,
                rgba(0, 0, 0, 0) 0px,
                rgba(0, 0, 0, 0.1) 50px,
                rgba(0, 0, 0, 0) 100px
              )
            `,
            backgroundSize: '100% 40px, 200px 100%'
          }}
        >
          <div className="absolute top-0 left-0 w-12 h-full bg-gradient-to-r from-black/40 to-transparent" />
        </motion.div>
        
        <motion.div
          {...curtainAnimation.content}
          className="text-center z-10"
        >
          <Film className="w-16 h-16 mx-auto mb-6 text-[--theater-gold]" />
          <h1 className="text-[--theater-gold] text-6xl font-marquee mb-4">
            {title}
          </h1>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ 
              duration: 2,
              times: [0, 0.5, 1],
              repeat: 1
            }}
            className="text-white text-2xl"
          >
            {subtitle}
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }

  // Effetto Dissolvenza
  if (type === 'fade') {
    return (
      <motion.div
        {...fadeAnimation.container}
        className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      >
        <motion.div
          {...fadeAnimation.content}
          className="text-center"
        >
          <Film className="w-16 h-16 mx-auto mb-6 text-[--theater-gold]" />
          <h1 className="text-[--theater-gold] text-6xl font-marquee mb-4">
            {title}
          </h1>
          <p className="text-white text-2xl">{subtitle}</p>
        </motion.div>
      </motion.div>
    );
  }

  // Effetto Scorrimento
  return (
    <motion.div
      {...slideAnimation.container}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden"
    >
      <motion.div
        {...slideAnimation.content}
        className="text-center"
      >
        <Film className="w-16 h-16 mx-auto mb-6 text-[--theater-gold]" />
        <h1 className="text-[--theater-gold] text-6xl font-marquee mb-4">
          {title}
        </h1>
        <p className="text-white text-2xl">{subtitle}</p>
      </motion.div>
    </motion.div>
  );
};

export default IntroAnimations;