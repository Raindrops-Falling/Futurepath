import { motion } from 'motion/react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { GeometricShapes } from '../../components/GeometricShapes';
import { Footer } from '../../components/Footer';
import { Construction } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ComingSoonProps {
  title: string;
  description: string;
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white text-black relative pt-24">
      <GeometricShapes />
      
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        <div className="mb-8">
          <Link to="/games">
            <Button variant="outline" className="mb-4 border-black/20 hover:border-[#D4AF37]">
              ← Back to Games
            </Button>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="p-16 border-2 border-dashed border-gray-300 text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-[#D4AF37]/10 rounded-full flex items-center justify-center">
              <Construction className="w-12 h-12 text-[#D4AF37]" />
            </div>
            
            <h1 className="text-5xl mb-4">{title}</h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              {description}
            </p>
            
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">Coming Soon!</h3>
              <p className="text-yellow-800">
                This feature is currently under development. Check back soon for an amazing interactive experience.
              </p>
            </div>

            <Link to="/games">
              <Button className="bg-black hover:bg-[#D4AF37] text-white">
                Explore Other Games
              </Button>
            </Link>
          </Card>
        </motion.div>
      </div>
      
      <Footer />
    </div>
  );
}
