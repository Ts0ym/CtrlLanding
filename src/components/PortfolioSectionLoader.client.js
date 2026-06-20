"use client";

import { useEffect, useState } from "react";
import PortfolioSection from "./PortfolioSection.client";
import {
  getProjectsApiBase,
  mapBackendProjectToCard,
} from "../lib/portfolioProjects";

const PORTFOLIO_LOAD_DELAY_MS = 250;
const PORTFOLIO_LOAD_MAX_WAIT_MS = 2500;

export default function PortfolioSectionLoader() {
  const [cards, setCards] = useState([]);

  useEffect(() => {
    let cancelled = false;
    let scheduled = false;
    let delayTimeoutId = 0;
    let maxWaitTimeoutId = 0;
    let idleCallbackId = 0;

    const loadProjects = async () => {
      try {
        const response = await fetch(`${getProjectsApiBase()}/projects`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Failed to load projects: ${response.status}`);
        }

        const data = await response.json();
        if (cancelled) return;

        setCards(Array.isArray(data) ? data.map(mapBackendProjectToCard) : []);
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load portfolio projects", error);
          setCards([]);
        }
      }
    };

    const scheduleLoadProjects = () => {
      if (scheduled || cancelled) return;
      scheduled = true;
      window.clearTimeout(maxWaitTimeoutId);

      delayTimeoutId = window.setTimeout(() => {
        const run = () => {
          if (!cancelled) loadProjects();
        };

        if ("requestIdleCallback" in window) {
          idleCallbackId = window.requestIdleCallback(run, { timeout: 1000 });
        } else {
          run();
        }
      }, PORTFOLIO_LOAD_DELAY_MS);
    };

    if (window.__introDone) {
      scheduleLoadProjects();
    } else {
      window.addEventListener("intro:done", scheduleLoadProjects, { once: true });
      maxWaitTimeoutId = window.setTimeout(
        scheduleLoadProjects,
        PORTFOLIO_LOAD_MAX_WAIT_MS,
      );
    }

    return () => {
      cancelled = true;
      window.removeEventListener("intro:done", scheduleLoadProjects);
      window.clearTimeout(delayTimeoutId);
      window.clearTimeout(maxWaitTimeoutId);
      if (idleCallbackId && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleCallbackId);
      }
    };
  }, []);

  return <PortfolioSection cards={cards} />;
}
