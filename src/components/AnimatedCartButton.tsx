import { ShoppingCart } from "lucide-react";
import { useCart } from "../context/CartContext";

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
      className={`relative inline-flex items-center justify-center transition-transform active:scale-90 hover:scale-105 ${className}`}
      aria-label="Ver Carrito de Compras"
    >
      <ShoppingCart 
        size={size} 
        color={color}
        className="transition-transform duration-200"
      />
      {totalItems > 0 && (
        <span className="absolute -top-2 -right-2 bg-chilca text-nogal text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-xs animate-in zoom-in-50 duration-200">
          {totalItems}
        </span>
      )}
    </button>
  );
}

