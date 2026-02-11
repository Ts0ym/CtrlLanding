"use client";

import { useCallback } from "react";
import Image from "next/image";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function ScrollDownArrow({ className, iconClassName }) {
  const onClick = useCallback((e) => {
    e.preventDefault();

    const smoother = ScrollSmoother.get?.();
    const current = smoother?.scrollTop?.() ?? window.scrollY ?? 0;

    // Prefer the pinned stage ScrollTrigger (most accurate with pin/scrub)
    const stage = document.querySelector('[data-scroll="stage"]');
    const stageST = stage
      ? ScrollTrigger.getAll().find((t) => t.trigger === stage)
      : null;

    const getTop = (el) => {
      if (!el) return null;
      const rectTop = el.getBoundingClientRect().top;
      return rectTop + current;
    };

    const about = document.querySelector("#about");
    const work = document.querySelector("#work");
    const contact = document.querySelector("#contact");
    const workTop = getTop(work);
    const contactTop = getTop(contact);

    // Prefer the pinned stage ScrollTrigger for the hero->about transition.
    let target = null;
    if (stageST && current < stageST.end - 1) {
      target = stageST.end - 1; // small nudge so we're safely inside the end
    } else if (workTop !== null && current < workTop - 1) {
      target = workTop;
    } else if (contactTop !== null && current < contactTop - 1) {
      target = contactTop;
    } else {
      target = current + window.innerHeight;
    }

    if (smoother?.scrollTo) {
      smoother.scrollTo(target, true);
      return;
    }

    window.scrollTo({ top: target, behavior: "smooth" });
  }, []);

  return (
    <button
      type="button"
      className={className}
      data-anim="arrow"
      onClick={onClick}
      aria-label="Scroll to next section"
    >
      <Image className={iconClassName} src="/svg/arrow.svg" alt="" width={15} height={16} />
    </button>
  );
}

