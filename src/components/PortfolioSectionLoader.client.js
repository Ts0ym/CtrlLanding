"use client";

import { useEffect, useState } from "react";
import PortfolioSection from "./PortfolioSection.client";
import {
  getProjectsApiBase,
  mapBackendProjectToCard,
} from "../lib/portfolioProjects";

export default function PortfolioSectionLoader() {
  const [cards, setCards] = useState([]);

  useEffect(() => {
    let cancelled = false;

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

    loadProjects();

    return () => {
      cancelled = true;
    };
  }, []);

  return <PortfolioSection cards={cards} />;
}
