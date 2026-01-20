import React from 'react';

interface BackgroundIconProps {
  name: string;
  color: string;
  className?: string;
}

const BackgroundIcon: React.FC<BackgroundIconProps> = ({ name, color, className = '' }) => {
  const iconPath = `/src/assets/icons/${name}.svg`;
  
  return (
    <div 
      className={`bg-icon ${className}`}
      style={{ 
        color: color,
        maskImage: `url(${iconPath})`,
        WebkitMaskImage: `url(${iconPath})`,
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
        backgroundColor: color
      }}
    />
  );
};

export default BackgroundIcon;