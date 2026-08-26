/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { AdUnit, AdPlacement } from '../../types';

interface AdSlotProps {
  placement: AdPlacement;
  adUnits: AdUnit[];
  className?: string;
}

export const AdSlot: React.FC<AdSlotProps> = ({ placement, adUnits, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeAd = adUnits.find(a => a.placement === placement && a.active);

  useEffect(() => {
    if (!activeAd || !containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = '';

    // Create a sandbox or directly inject trusted admin-configured HTML/scripts
    const wrapper = document.createElement('div');
    wrapper.className = 'w-full flex justify-center items-center my-2';
    wrapper.innerHTML = activeAd.code;

    // Execute any script tags embedded in the snippet
    const scripts = wrapper.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
      const oldScript = scripts[i];
      const newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
      newScript.appendChild(document.createTextNode(oldScript.innerHTML));
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    }

    container.appendChild(wrapper);
  }, [activeAd]);

  if (!activeAd) return null;

  return (
    <div 
      ref={containerRef} 
      className={`ad-placement-slot ad-${placement} overflow-hidden ${className}`} 
      data-placement={placement}
    />
  );
};
