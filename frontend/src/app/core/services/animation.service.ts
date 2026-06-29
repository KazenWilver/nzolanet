import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import gsap from 'gsap';

type EnterVariant = 'fadeUp' | 'fadeIn' | 'scaleIn' | 'slideRight';

/**
 * Serviço central de animações com GSAP, respeitando prefers-reduced-motion.
 */
@Injectable({ providedIn: 'root' })
export class AnimationService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private reducedMotion = false;

  constructor() {
    if (this.isBrowser) {
      const media = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.reducedMotion = media.matches;
      media.addEventListener('change', event => {
        this.reducedMotion = event.matches;
      });
    }
  }

  get isEnabled(): boolean {
    return this.isBrowser && !this.reducedMotion;
  }

  get isMobile(): boolean {
    if (!this.isBrowser) {
      return false;
    }

    return window.matchMedia('(max-width: 500px)').matches;
  }

  enter(element: Element | Element[], variant: EnterVariant = 'fadeUp', delay = 0): gsap.core.Tween | null {
    if (!this.isEnabled) {
      return null;
    }

    const targets = gsap.utils.toArray(element);
    if (!targets.length) {
      return null;
    }

    const mobile = this.isMobile;
    const distance = mobile ? 10 : 16;
    const duration = mobile ? 0.32 : 0.42;

    const from: gsap.TweenVars = { opacity: 0, delay };
    const to: gsap.TweenVars = {
      opacity: 1,
      duration,
      ease: 'power2.out',
      overwrite: 'auto',
      clearProps: 'transform,opacity'
    };

    switch (variant) {
      case 'fadeIn':
        break;
      case 'scaleIn':
        from.scale = 0.96;
        to.scale = 1;
        break;
      case 'slideRight':
        from.x = mobile ? -12 : -18;
        to.x = 0;
        break;
      case 'fadeUp':
      default:
        from.y = distance;
        to.y = 0;
        break;
    }

    gsap.set(targets, from);
    return gsap.to(targets, to);
  }

  staggerEnter(
    elements: Element | Element[],
    variant: EnterVariant = 'fadeUp',
    stagger = 0.055
  ): gsap.core.Tween | null {
    if (!this.isEnabled) {
      return null;
    }

    const targets = gsap.utils.toArray(elements);
    if (!targets.length) {
      return null;
    }

    const mobile = this.isMobile;
    const distance = mobile ? 10 : 16;

    gsap.set(targets, { opacity: 0, y: variant === 'fadeUp' ? distance : 0 });

    return gsap.to(targets, {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      duration: mobile ? 0.32 : 0.42,
      stagger: mobile ? stagger * 0.75 : stagger,
      ease: 'power2.out',
      overwrite: 'auto',
      clearProps: 'transform,opacity'
    });
  }

  pageEnter(element: Element): gsap.core.Tween | null {
    return this.enter(element, 'fadeUp', 0);
  }

  modalEnter(overlay: Element, dialog: Element): void {
    if (!this.isEnabled) {
      return;
    }

    gsap.killTweensOf([overlay, dialog]);
    const mobile = this.isMobile;

    gsap.set(overlay, { opacity: 0 });
    gsap.set(dialog, {
      opacity: 0,
      y: mobile ? 28 : 12,
      scale: mobile ? 1 : 0.98
    });

    gsap.to(overlay, {
      opacity: 1,
      duration: 0.22,
      ease: 'power1.out',
      overwrite: 'auto',
      clearProps: 'opacity'
    });
    gsap.to(dialog, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: mobile ? 0.36 : 0.42,
      ease: 'power3.out',
      delay: 0.04,
      overwrite: 'auto',
      clearProps: 'opacity,transform'
    });
  }

  likePop(element: Element): void {
    if (!this.isEnabled) {
      return;
    }

    gsap.fromTo(
      element,
      { scale: 1 },
      {
        scale: 1.28,
        duration: 0.18,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1
      }
    );
  }

  pressFeedback(element: Element): void {
    if (!this.isEnabled) {
      return;
    }

    gsap.fromTo(
      element,
      { scale: 1 },
      {
        scale: 0.94,
        duration: 0.08,
        ease: 'power2.in',
        yoyo: true,
        repeat: 1
      }
    );
  }

  shake(element: Element): void {
    if (!this.isEnabled) {
      return;
    }

    gsap.fromTo(
      element,
      { x: 0 },
      {
        x: -6,
        duration: 0.06,
        ease: 'power1.inOut',
        yoyo: true,
        repeat: 5,
        onComplete: () => {
          gsap.set(element, { x: 0 });
        }
      }
    );
  }

  expandHeight(element: Element): void {
    if (!this.isEnabled) {
      return;
    }

    gsap.fromTo(
      element,
      { opacity: 0, height: 0 },
      {
        opacity: 1,
        height: 'auto',
        duration: 0.34,
        ease: 'power2.out'
      }
    );
  }

  /**
   * Explosão de confetti a partir do centro de um elemento (ex.: botão Baze).
   */
  confettiBurst(origin: Element): void {
    if (!this.isEnabled) {
      return;
    }

    const rect = origin.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;
    const colors = ['#f91880', '#7856ff', '#1d9bf0', '#ffd400', '#00ba7c'];

    let canvas = document.getElementById('nz-confetti-canvas') as HTMLCanvasElement | null;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'nz-confetti-canvas';
      canvas.setAttribute('aria-hidden', 'true');
      canvas.style.cssText =
        'position:fixed;inset:0;pointer-events:none;z-index:9999;width:100%;height:100%';
      document.body.appendChild(canvas);
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    type Particle = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      rotation: number;
      rotationSpeed: number;
      life: number;
    };

    const particles: Particle[] = Array.from({ length: 28 }, () => ({
      x: originX,
      y: originY,
      vx: (Math.random() - 0.5) * 14,
      vy: (Math.random() - 1) * 12 - 5,
      size: 4 + Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)] ?? colors[0],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 24,
      life: 1
    }));

    const render = (): void => {
      context.clearRect(0, 0, canvas!.width, canvas!.height);
      let alive = false;

      for (const particle of particles) {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.38;
        particle.life -= 0.022;
        particle.rotation += particle.rotationSpeed;

        if (particle.life <= 0) {
          continue;
        }

        alive = true;
        context.save();
        context.translate(particle.x, particle.y);
        context.rotate((particle.rotation * Math.PI) / 180);
        context.globalAlpha = particle.life;
        context.fillStyle = particle.color;
        context.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size * 0.65);
        context.restore();
      }

      if (alive) {
        requestAnimationFrame(render);
        return;
      }

      context.clearRect(0, 0, canvas!.width, canvas!.height);
    };

    requestAnimationFrame(render);
  }
}
