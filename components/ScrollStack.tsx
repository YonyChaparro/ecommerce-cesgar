import React, { useLayoutEffect, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import Lenis from 'lenis';

export interface ScrollStackItemProps {
  itemClassName?: string;
  children: ReactNode;
}

export const ScrollStackItem: React.FC<ScrollStackItemProps> = ({ children, itemClassName = '' }) => (
  <div
    className={`scroll-stack-card relative w-full h-80 my-8 p-12 rounded-[40px] shadow-[0_0_30px_rgba(0,0,0,0.1)] box-border origin-top will-change-transform ${itemClassName}`.trim()}
    style={{ backfaceVisibility: 'hidden', transformStyle: 'preserve-3d' }}
  >
    {children}
  </div>
);

interface ScrollStackProps {
  className?: string;
  children: ReactNode;
  itemDistance?: number;
  itemScale?: number;
  itemStackDistance?: number;
  stackPosition?: string;
  scaleEndPosition?: string;
  baseScale?: number;
  scaleDuration?: number;
  rotationAmount?: number;
  blurAmount?: number;
  useWindowScroll?: boolean;
  onStackComplete?: () => void;
}

const ScrollStack: React.FC<ScrollStackProps> = ({
  children,
  className = '',
  itemDistance = 100,
  itemScale = 0.03,
  itemStackDistance = 30,
  stackPosition = '20%',
  scaleEndPosition = '10%',
  baseScale = 0.85,
  scaleDuration = 0.5,
  rotationAmount = 0,
  blurAmount = 0,
  useWindowScroll = false,
  onStackComplete,
}) => {
  const scrollerRef        = useRef<HTMLDivElement>(null);
  const stackCompletedRef  = useRef(false);
  const animationFrameRef  = useRef<number | null>(null);
  const lenisRef           = useRef<Lenis | null>(null);
  const cardsRef           = useRef<HTMLElement[]>([]);
  const lastTransformsRef  = useRef(new Map<number, { translateY: number; scale: number; rotation: number; blur: number }>());
  const isUpdatingRef      = useRef(false);

  // Cached layout offsets (from top of document, pre-transform) — only used in useWindowScroll mode
  const cardOffsetsRef = useRef<number[]>([]);
  const endOffsetRef   = useRef<number>(0);

  const calculateProgress = useCallback((scrollTop: number, start: number, end: number) => {
    if (scrollTop < start) return 0;
    if (scrollTop > end) return 1;
    return (scrollTop - start) / (end - start);
  }, []);

  const parsePercentage = useCallback((value: string | number, containerHeight: number) => {
    if (typeof value === 'string' && value.includes('%')) {
      return (parseFloat(value) / 100) * containerHeight;
    }
    return parseFloat(value as string);
  }, []);

  const getScrollData = useCallback(() => {
    if (useWindowScroll) {
      return { scrollTop: window.scrollY, containerHeight: window.innerHeight };
    }
    const scroller = scrollerRef.current;
    return {
      scrollTop: scroller ? scroller.scrollTop : 0,
      containerHeight: scroller ? scroller.clientHeight : 0,
    };
  }, [useWindowScroll]);

  // In window-scroll mode we return the CACHED offset so that applied CSS
  // transforms (which shift getBoundingClientRect) never pollute the math.
  const getElementOffset = useCallback(
    (element: HTMLElement) => {
      if (useWindowScroll) {
        const idx = cardsRef.current.indexOf(element);
        if (idx !== -1) return cardOffsetsRef.current[idx] ?? 0;
        return endOffsetRef.current; // end sentinel
      }
      return element.offsetTop;
    },
    [useWindowScroll],
  );

  const updateCardTransforms = useCallback(() => {
    if (!cardsRef.current.length || isUpdatingRef.current) return;
    isUpdatingRef.current = true;

    const { scrollTop, containerHeight } = getScrollData();
    const stackPositionPx    = parsePercentage(stackPosition, containerHeight);
    const scaleEndPositionPx = parsePercentage(scaleEndPosition, containerHeight);
    const endElementTop      = useWindowScroll
      ? endOffsetRef.current
      : (() => {
          const el = scrollerRef.current?.querySelector('.scroll-stack-end') as HTMLElement | null;
          return el ? el.offsetTop : 0;
        })();

    cardsRef.current.forEach((card, i) => {
      if (!card) return;

      const cardTop    = getElementOffset(card);
      const triggerStart = cardTop - stackPositionPx - itemStackDistance * i;
      const triggerEnd   = cardTop - scaleEndPositionPx;
      const pinStart     = triggerStart;
      const pinEnd       = endElementTop - containerHeight / 2;

      const scaleProgress = calculateProgress(scrollTop, triggerStart, triggerEnd);
      const targetScale   = baseScale + i * itemScale;
      const scale         = 1 - scaleProgress * (1 - targetScale);
      const rotation      = rotationAmount ? i * rotationAmount * scaleProgress : 0;

      let blur = 0;
      if (blurAmount) {
        let topCardIndex = 0;
        for (let j = 0; j < cardsRef.current.length; j++) {
          const jCardTop     = getElementOffset(cardsRef.current[j]);
          const jTriggerStart = jCardTop - stackPositionPx - itemStackDistance * j;
          if (scrollTop >= jTriggerStart) topCardIndex = j;
        }
        if (i < topCardIndex) blur = Math.max(0, (topCardIndex - i) * blurAmount);
      }

      let translateY = 0;
      const isPinned = scrollTop >= pinStart && scrollTop <= pinEnd;
      if (isPinned) {
        translateY = scrollTop - cardTop + stackPositionPx + itemStackDistance * i;
      } else if (scrollTop > pinEnd) {
        translateY = pinEnd - cardTop + stackPositionPx + itemStackDistance * i;
      }

      const next = {
        translateY: Math.round(translateY * 100) / 100,
        scale:      Math.round(scale * 1000) / 1000,
        rotation:   Math.round(rotation * 100) / 100,
        blur:       Math.round(blur * 100) / 100,
      };

      const prev = lastTransformsRef.current.get(i);
      const changed =
        !prev ||
        Math.abs(prev.translateY - next.translateY) > 0.1 ||
        Math.abs(prev.scale      - next.scale)      > 0.001 ||
        Math.abs(prev.rotation   - next.rotation)   > 0.1 ||
        Math.abs(prev.blur       - next.blur)        > 0.1;

      if (changed) {
        card.style.transform = `translate3d(0, ${next.translateY}px, 0) scale(${next.scale}) rotate(${next.rotation}deg)`;
        card.style.filter    = next.blur > 0 ? `blur(${next.blur}px)` : '';
        lastTransformsRef.current.set(i, next);
      }

      if (i === cardsRef.current.length - 1) {
        const inView = scrollTop >= pinStart && scrollTop <= pinEnd;
        if (inView && !stackCompletedRef.current) {
          stackCompletedRef.current = true;
          onStackComplete?.();
        } else if (!inView && stackCompletedRef.current) {
          stackCompletedRef.current = false;
        }
      }
    });

    isUpdatingRef.current = false;
  }, [
    itemScale, itemStackDistance, stackPosition, scaleEndPosition,
    baseScale, rotationAmount, blurAmount, useWindowScroll, onStackComplete,
    calculateProgress, parsePercentage, getScrollData, getElementOffset,
  ]);

  const handleScroll = useCallback(() => { updateCardTransforms(); }, [updateCardTransforms]);

  const setupLenis = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const lenis = new Lenis({
      wrapper: scroller,
      content: scroller.querySelector('.scroll-stack-inner') as HTMLElement,
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 2,
      infinite: false,
      gestureOrientation: 'vertical',
      wheelMultiplier: 1,
      lerp: 0.1,
      syncTouch: true,
      syncTouchLerp: 0.075,
    });

    lenis.on('scroll', handleScroll);

    const raf = (time: number) => {
      lenis.raf(time);
      animationFrameRef.current = requestAnimationFrame(raf);
    };
    animationFrameRef.current = requestAnimationFrame(raf);
    lenisRef.current = lenis;
  }, [handleScroll]);

  useLayoutEffect(() => {
    const cards = Array.from(
      useWindowScroll
        ? document.querySelectorAll('.scroll-stack-card')
        : (scrollerRef.current?.querySelectorAll('.scroll-stack-card') ?? []),
    ) as HTMLElement[];

    cardsRef.current = cards;
    const transformsCache = lastTransformsRef.current;

    cards.forEach((card, i) => {
      if (i < cards.length - 1) card.style.marginBottom = `${itemDistance}px`;
      card.style.willChange        = 'transform, filter';
      card.style.transformOrigin   = 'top center';
      card.style.backfaceVisibility = 'hidden';
      card.style.transform         = 'translateZ(0)';
    });

    if (useWindowScroll) {
      // Cache positions NOW — before any scroll-driven transform is applied.
      // getBoundingClientRect is accurate here because no translateY has been set yet.
      cardOffsetsRef.current = cards.map((card) => {
        const rect = card.getBoundingClientRect();
        return rect.top + window.scrollY;
      });
      const endEl = document.querySelector('.scroll-stack-end') as HTMLElement | null;
      if (endEl) {
        const rect = endEl.getBoundingClientRect();
        endOffsetRef.current = rect.top + window.scrollY;
      }

      // Recalculate cached offsets on resize (layout may shift)
      const onResize = () => {
        // Reset transforms so getBoundingClientRect is accurate
        cards.forEach((card) => { card.style.transform = 'translateZ(0)'; });
        lastTransformsRef.current.clear();
        cardOffsetsRef.current = cards.map((card) => {
          const rect = card.getBoundingClientRect();
          return rect.top + window.scrollY;
        });
        const endEl2 = document.querySelector('.scroll-stack-end') as HTMLElement | null;
        if (endEl2) endOffsetRef.current = endEl2.getBoundingClientRect().top + window.scrollY;
        updateCardTransforms();
      };
      window.addEventListener('resize', onResize);

      // Use native scroll + rAF — no Lenis on the window to avoid conflicts
      const onScroll = () => { updateCardTransforms(); };
      window.addEventListener('scroll', onScroll, { passive: true });
      updateCardTransforms();

      return () => {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onResize);
        stackCompletedRef.current = false;
        cardsRef.current = [];
        transformsCache.clear();
        isUpdatingRef.current = false;
      };
    }

    if (!scrollerRef.current) return;
    setupLenis();
    updateCardTransforms();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (lenisRef.current) lenisRef.current.destroy();
      stackCompletedRef.current = false;
      cardsRef.current = [];
      transformsCache.clear();
      isUpdatingRef.current = false;
    };
  }, [
    itemDistance, itemScale, itemStackDistance, stackPosition, scaleEndPosition,
    baseScale, scaleDuration, rotationAmount, blurAmount, useWindowScroll,
    onStackComplete, setupLenis, updateCardTransforms,
  ]);

  if (useWindowScroll) {
    return (
      <div ref={scrollerRef} className={`relative w-full ${className}`.trim()}>
        <div className="scroll-stack-inner pb-160">
          {children}
          <div className="scroll-stack-end w-full h-px" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full h-full overflow-y-auto overflow-x-visible ${className}`.trim()}
      ref={scrollerRef}
      style={{
        overscrollBehavior: 'contain',
        WebkitOverflowScrolling: 'touch',
        scrollBehavior: 'smooth',
        transform: 'translateZ(0)',
        willChange: 'scroll-position',
      }}
    >
      <div className="scroll-stack-inner pt-[20vh] px-20 pb-200 min-h-screen">
        {children}
        <div className="scroll-stack-end w-full h-px" />
      </div>
    </div>
  );
};

export default ScrollStack;
