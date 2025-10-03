import * as React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className = '', ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={
        'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors ' +
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black disabled:opacity-50 disabled:pointer-events-none ' +
        'bg-black text-white hover:bg-black/90 px-3 py-2 ' +
        className
      }
      {...props}
    />
  )
})
Button.displayName = 'Button'
