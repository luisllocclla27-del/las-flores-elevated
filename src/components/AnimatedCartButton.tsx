import { ShoppingCartIcon } from '@animateicons/react/lucide';
import { useCart } from '../context/CartContext';

interface AnimatedCartButtonProps {
  onClick: () => void;
  className?: string;
  size?: number;
  color?: string;
}

export function AnimatedCartButton({ 
  onClick, 
  className = "", 
  size = 20,
  color
}: AnimatedCartButtonProps) {
  const { totalItems } = useCart();

  return (
    <button
      onClick={onClick}
      className={`relative ${className}`}
    >
      <ShoppingCartIcon 
        size={size} 
        color={color}
      />
      {totalItems > 0 && (
        <span className="absolute -top-2 -right-2 bg-chilca text-nogal text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
          {totalItems}
        </span>
      )}
    </button>
  );
}
