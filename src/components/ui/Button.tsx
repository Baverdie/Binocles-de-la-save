"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { forwardRef } from "react";

interface ButtonProps {
  children: React.ReactNode;
  href?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}

const variants = {
  primary:
    "bg-brown text-beige hover:bg-brown/90 border-transparent",
  secondary:
    "bg-beige text-brown hover:bg-beige/90 border-transparent",
  outline:
    "bg-transparent text-brown border-brown hover:bg-brown hover:text-beige",
  ghost:
    "bg-transparent text-brown hover:bg-brown/10 border-transparent",
};

const sizes = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      href,
      variant = "primary",
      size = "md",
      className = "",
      onClick,
      type = "button",
      disabled = false,
    },
    ref
  ) => {
    const baseStyles = `
      inline-flex items-center justify-center font-medium
      border-2 rounded-sm transition-all duration-300 ease-out
      focus:outline-none focus:ring-2 focus:ring-brown/20 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
    `;

    const buttonClasses = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

    if (href) {
      return (
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Link href={href} className={buttonClasses}>
            {children}
          </Link>
        </motion.div>
      );
    }

    return (
      <motion.button
        ref={ref}
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={buttonClasses}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {children}
      </motion.button>
    );
  }
);

Button.displayName = "Button";

export default Button;
