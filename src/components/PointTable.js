import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import axios from "axios";
import html2canvas from "html2canvas";
import { API_ENDPOINTS } from "../const";
import { useMemo } from "react";
import PlayoffFixtures from "./PlayoffFixtures";
import { FaWhatsapp } from "react-icons/fa";

/* =========================================================
   Points Table — broadcast (IPL-style) board
   Row = rank (light) + skew logo slab + themed stat strip + PTS block.
   Team colours from themePrimary / themeSecondary (hash fallback).
   ========================================================= */

const TabContainer = styled.div`
  margin: 0.75rem auto 2rem;
  width: calc(100% - 1rem);
  max-width: 960px;
  background: linear-gradient(180deg, #eef1f6 0%, #e4e8ef 100%);
  border-radius: 14px;
  border: 1px solid rgba(12, 35, 68, 0.14);
  box-shadow: 0 18px 48px -28px rgba(12, 35, 68, 0.45);
  overflow: hidden;

  @media (max-width: 640px) {
    width: calc(100% - 0.35rem);
    margin: 0.2rem auto 0.45rem;
    border-radius: 8px;
    overflow-x: visible;
    overflow-y: visible;
  }
`;

const TabHeader = styled.div`
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  gap: 0.25rem;
  padding: calc(0.28rem + env(safe-area-inset-top, 0px)) 0.28rem 0;
  padding-left: max(0.28rem, env(safe-area-inset-left, 0px));
  padding-right: max(0.28rem, env(safe-area-inset-right, 0px));
  background: linear-gradient(180deg, #d9dee8 0%, #ccd4e2 100%);
  border-bottom: 2px solid #0c2344;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar { display: none; }
`;

const TabButton = styled.button`
  flex: 0 0 auto;
  padding: 0.45rem 0.75rem 0.52rem;
  min-height: 34px;
  background: transparent;
  color: ${(props) => (props.active ? '#0c2344' : 'rgba(12, 35, 68, 0.52)')};
  border: none;
  border-bottom: 3px solid ${(props) => (props.active ? '#00b4d8' : 'transparent')};
  border-radius: 0;
  font-weight: ${(props) => (props.active ? '800' : '600')};
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease;
  font-size: 0.82rem;
  font-family: var(--font-broadcast), 'Arial Narrow', sans-serif;
  font-style: italic;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
  margin-bottom: -2px;

  &:hover {
    color: #0c2344;
  }

  @media (max-width: 640px) {
    padding: 0.38rem 0.55rem 0.45rem;
    font-size: 0.72rem;
    min-height: 32px;
  }
`;

const TableWrapper = styled.div`
  padding: 0.45rem 0.55rem 0.85rem;
  padding-bottom: calc(0.85rem + env(safe-area-inset-bottom, 0px));
  background: transparent;

  @media (max-width: 640px) {
    padding: 0.22rem 0.28rem 0.42rem;
    padding-bottom: calc(0.42rem + env(safe-area-inset-bottom, 0px));
    padding-left: max(0.28rem, env(safe-area-inset-left, 0px));
    padding-right: max(0.28rem, env(safe-area-inset-right, 0px));
  }
`;

const TableCaptureArea = styled.div`
  position: relative;
  isolation: isolate;
  overflow: hidden;
  font-family: var(--font-broadcast), 'Arial Narrow', sans-serif;
  border-radius: 8px;
  padding: 0.72rem 0.72rem 0.65rem;
  border: 1px solid rgba(12, 35, 68, 0.1);
  background: linear-gradient(168deg, #ebecef 0%, #e1e4eb 42%, #d7dbe4 100%);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    opacity: 0.62;
    background:
      radial-gradient(ellipse 90% 60% at -8% -18%, rgba(255, 214, 98, 0.55), transparent 58%),
      radial-gradient(ellipse 75% 55% at 10% 8%, rgba(255, 148, 92, 0.42), transparent 52%),
      radial-gradient(ellipse 70% 50% at -5% 22%, rgba(130, 206, 255, 0.48), transparent 55%);
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    opacity: 0.045;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E");
  }

  & > * {
    position: relative;
    z-index: 1;
  }

  @media (max-width: 640px) {
    padding: 0.32rem max(0.32rem, env(safe-area-inset-left, 0px))
      calc(0.38rem + env(safe-area-inset-bottom, 0px))
      max(0.32rem, env(safe-area-inset-right, 0px));
    border-radius: 6px;
  }

  @media (max-width: 380px) {
    padding: 0.28rem max(0.28rem, env(safe-area-inset-left, 0px))
      calc(0.32rem + env(safe-area-inset-bottom, 0px))
      max(0.28rem, env(safe-area-inset-right, 0px));
  }
`;

/** Reference-style opener: dark navy season/context line above the skew banner */
const BroadcastTitleStack = styled.div`
  text-align: center;
  margin-bottom: 0.2rem;

  @media (max-width: 640px) {
    margin-bottom: 0.12rem;
  }
`;

const BroadcastSeasonLine = styled.div`
  font-family: var(--font-broadcast), 'Arial Narrow', sans-serif;
  font-style: italic;
  font-weight: 800;
  font-size: clamp(0.88rem, 3.35vw, 1.42rem);
  color: #0a1f44;
  letter-spacing: 0.055em;
  text-transform: uppercase;
  line-height: 1.12;

  @media (max-width: 640px) {
    font-size: clamp(0.76rem, 2.95vw, 1.05rem);
    letter-spacing: 0.05em;
  }
`;

const BroadcastHeroRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  margin-bottom: 0.52rem;
  flex-wrap: wrap;

  @media (max-width: 640px) {
    gap: 0.38rem;
    margin-bottom: 0.32rem;
  }

  @media (max-width: 420px) {
    flex-direction: column;
    align-items: center;
    gap: 0.32rem;
  }
`;

const BroadcastSkewTitle = styled.div`
  display: inline-block;
  transform: skewX(-12deg);
  background: linear-gradient(90deg, #071a33 0%, #0f3561 52%, #143a64 100%);
  padding: 0.42rem 1.85rem 0.46rem;
  border-radius: 2px;
  box-shadow: 0 4px 14px rgba(12, 35, 68, 0.28);

  span {
    display: block;
    transform: skewX(12deg);
    font-family: var(--font-broadcast), 'Arial Narrow', sans-serif;
    font-size: clamp(1.12rem, 4.85vw, 2.18rem);
    font-weight: 800;
    font-style: italic;
    letter-spacing: 0.07em;
    color: #8ae9ff;
    text-transform: uppercase;
    text-shadow: none;
    line-height: 1;
  }

  @media (max-width: 640px) {
    padding: 0.34rem 1.25rem 0.38rem;
  }

  @media (max-width: 380px) {
    padding: 0.3rem 1rem 0.34rem;

    span {
      font-size: clamp(1rem, 5.5vw, 1.35rem);
    }
  }
`;

const WhatsAppShareButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  border: 1px solid rgba(6, 95, 70, 0.35);
  border-radius: 999px;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #ffffff;
  padding: 0.42rem 0.75rem;
  font-family: var(--font-broadcast);
  font-size: 0.82rem;
  font-weight: 800;
  font-style: italic;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
  box-shadow: 0 6px 16px -8px rgba(22, 163, 74, 0.8);
  white-space: nowrap;

  &:hover {
    transform: translateY(-1px);
    filter: brightness(1.05);
  }

  &:disabled {
    cursor: wait;
    opacity: 0.75;
    transform: none;
  }

  @media (max-width: 640px) {
    padding: 0.38rem 0.55rem;
    font-size: 0.72rem;

    span {
      display: none;
    }
  }
`;

/** Mirrors BroadcastRowWrap + BroadcastCard geometry so P/W/L/NRR align with body cells */
const BroadcastTableHeadRow = styled.div`
  display: flex;
  align-items: stretch;
  gap: 0;
  margin-bottom: 0.4rem;

  @media (max-width: 640px) {
    margin-bottom: 0.22rem;
  }

  @media (max-width: 380px) {
    margin-bottom: 0.2rem;
  }
`;

const BroadcastRankSpacer = styled.div`
  flex: 0 0 2.65rem;
  width: 2.65rem;
  flex-shrink: 0;
  align-self: stretch;
  background: #ffffff;
  clip-path: polygon(0 0, 100% 0, 68% 100%, 0 100%);
  border-radius: 4px 0 0 4px;

  @media (max-width: 640px) {
    flex-basis: 2rem;
    width: 2rem;
    clip-path: polygon(0 0, 100% 0, 62% 100%, 0 100%);
  }

  @media (max-width: 380px) {
    flex-basis: 1.78rem;
    width: 1.78rem;
    clip-path: polygon(0 0, 100% 0, 58% 100%, 0 100%);
  }
`;

const BroadcastHeadCard = styled.div`
  flex: 1;
  display: flex;
  align-items: stretch;
  gap: 0;
  min-width: 0;
  border-radius: 0 4px 4px 0;
  overflow: hidden;
`;

const BroadcastHeadMain = styled.div`
  flex: 1;
  display: flex;
  align-items: stretch;
  min-width: 0;
  margin-left: -0.95rem;
  overflow: hidden;
  border-radius: 0;

  @media (max-width: 640px) {
    margin-left: -0.72rem;
  }

  @media (max-width: 380px) {
    margin-left: -0.62rem;
  }
`;

const BroadcastHeadLogoSpacer = styled.div`
  flex: 0 0 50px;
  width: 50px;
  flex-shrink: 0;

  @media (max-width: 640px) {
    flex-basis: 36px;
    width: 36px;
  }

  @media (max-width: 380px) {
    flex-basis: 34px;
    width: 34px;
  }
`;

/** Keep grid-template columns, gaps, padding, margin-left identical to StatsStrip */
const BroadcastHeadGrid = styled.div`
  flex: 1;
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(48px, 1.08fr) 36px 36px 36px minmax(58px, 1fr);
  align-items: center;
  gap: 0 0.14rem;
  padding: 0.28rem 0.32rem 0.28rem 0.26rem;
  margin-left: -8px;
  font-family: var(--font-broadcast), 'Arial Narrow', sans-serif;
  font-style: italic;
  font-weight: 800;
  font-size: clamp(0.58rem, 1.85vw, 0.78rem);
  color: #0c2344;
  letter-spacing: 0.03em;
  text-transform: uppercase;

  span:nth-child(1) {
    text-align: left;
    padding-left: 0.15rem;
  }

  span:nth-child(n + 2) {
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    justify-self: stretch;
    width: 100%;
  }

  @media (max-width: 640px) {
    grid-template-columns: minmax(34px, 1fr) 26px 26px 26px minmax(46px, 1fr);
    font-size: 0.48rem;
    gap: 0 0.09rem;
    padding: 0.14rem 0.16rem 0.14rem 0.12rem;
    margin-left: -6px;
  }

  @media (max-width: 380px) {
    grid-template-columns: minmax(30px, 1fr) 23px 23px 23px minmax(42px, 1fr);
    font-size: 0.45rem;
    padding: 0.12rem 0.12rem 0.12rem 0.1rem;
  }
`;

const PtsHeadLabel = styled.div`
  flex: 0 0 54px;
  width: 54px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-broadcast), 'Arial Narrow', sans-serif;
  font-size: clamp(0.62rem, 2vw, 0.82rem);
  font-weight: 800;
  font-style: italic;
  color: #0c2344;
  text-transform: uppercase;

  @media (max-width: 640px) {
    flex-basis: 40px;
    width: 40px;
    font-size: 0.47rem;
  }

  @media (max-width: 380px) {
    flex-basis: 36px;
    width: 36px;
    font-size: 0.44rem;
  }
`;

const BroadcastRowWrap = styled.div`
  display: flex;
  align-items: stretch;
  gap: 0;
  margin-bottom: 0.42rem;

  ${({ $qualifierBoundary }) =>
    $qualifierBoundary
      ? `padding-bottom: 0.38rem; margin-bottom: 0.48rem; border-bottom: 2px dashed rgba(12, 35, 68, 0.35);`
      : ''}

  @media (max-width: 640px) {
    margin-bottom: 0.2rem;
  }
`;

/** IPL-style white rank tile with diagonal cut; overlaps navy logo slab beneath */
const BroadcastRankPanel = styled.div`
  flex: 0 0 2.65rem;
  width: 2.65rem;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: stretch;
  background: #ffffff;
  color: #0b2135;
  font-family: var(--font-broadcast), 'Arial Narrow', sans-serif;
  font-size: clamp(1rem, 3.6vw, 1.92rem);
  font-weight: 800;
  font-style: italic;
  line-height: 1;
  clip-path: polygon(0 0, 100% 0, 68% 100%, 0 100%);
  position: relative;
  z-index: 2;

  @media (max-width: 640px) {
    flex-basis: 2rem;
    width: 2rem;
    font-size: 1rem;
    clip-path: polygon(0 0, 100% 0, 62% 100%, 0 100%);
  }

  @media (max-width: 380px) {
    flex-basis: 1.78rem;
    width: 1.78rem;
    font-size: 0.92rem;
    clip-path: polygon(0 0, 100% 0, 58% 100%, 0 100%);
  }
`;

const BroadcastCard = styled.div`
  flex: 1;
  display: flex;
  align-items: stretch;
  gap: 0;
  min-width: 0;
  min-height: 48px;
  overflow: hidden;
  border-radius: 4px;
  background: #0b2135;
  box-shadow: 0 3px 10px rgba(12, 35, 68, 0.14);
  cursor: pointer;
  outline: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  user-select: none;

  &:hover {
    filter: brightness(1.03);
    box-shadow: 0 4px 14px rgba(12, 35, 68, 0.18);
  }

  &:active {
    filter: brightness(0.97);
  }

  &:focus-visible {
    box-shadow: 0 0 0 2px #00b4d8, 0 3px 10px rgba(12, 35, 68, 0.14);
  }

  @media (max-width: 640px) {
    min-height: 42px;
  }

  @media (max-width: 380px) {
    min-height: 40px;
  }

  @media (pointer: coarse) and (min-width: 641px) {
    min-height: 46px;
  }
`;

/** Pulled left so navy logo slab sits under the rank diagonal cut */
const BroadcastCardMain = styled.div`
  flex: 1;
  display: flex;
  align-items: stretch;
  min-width: 0;
  margin-left: -0.95rem;
  overflow: visible;
  border-radius: 0;
  position: relative;
  z-index: 1;

  @media (max-width: 640px) {
    margin-left: -0.72rem;
  }

  @media (max-width: 380px) {
    margin-left: -0.62rem;
  }
`;

const LogoSlab = styled.div`
  flex: 0 0 50px;
  flex-shrink: 0;
  width: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: stretch;
  background: ${({ $dark }) => $dark};
  clip-path: polygon(16% 0, 100% 0, 86% 100%, 0 100%);

  img {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(255, 255, 255, 0.9);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
    background: rgba(255, 255, 255, 0.92);
    display: block;
  }

  @media (max-width: 640px) {
    flex-basis: 36px;
    width: 36px;

    img {
      width: 22px;
      height: 22px;
      border-width: 1.5px;
    }
  }

  @media (max-width: 380px) {
    flex-basis: 34px;
    width: 34px;

    img {
      width: 21px;
      height: 21px;
    }
  }
`;

const StatsStrip = styled.div`
  flex: 1;
  min-width: 0;
  align-self: stretch;
  display: grid;
  grid-template-columns: minmax(48px, 1.08fr) 36px 36px 36px minmax(58px, 1fr);
  align-items: center;
  gap: 0 0.14rem;
  padding: 0.28rem 0.32rem 0.28rem 0.26rem;
  margin-left: -8px;
  position: relative;
  isolation: isolate;
  background: ${({ $fill }) => $fill};
  font-family: var(--font-broadcast), 'Arial Narrow', sans-serif;
  font-style: italic;
  font-weight: 800;
  font-size: clamp(0.66rem, 2.2vw, 1.12rem);
  color: ${({ $fg }) => $fg};
  letter-spacing: 0.02em;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    opacity: ${({ $pattern, $lightStrip }) =>
      $lightStrip ? ($pattern === 'waves' ? 0.09 : $pattern === 'stripes' ? 0.07 : 0) : ($pattern === 'waves' ? 0.14 : $pattern === 'stripes' ? 0.12 : 0)};
    background: ${({ $pattern, $fg }) =>
      $pattern === 'waves'
        ? `repeating-linear-gradient(
            118deg,
            transparent 0 6px,
            rgba(255, 255, 255, 0.22) 6px 7px,
            transparent 7px 14px
          ),
          radial-gradient(ellipse 120% 80% at 20% 50%, rgba(255, 255, 255, 0.2), transparent 55%)`
        : $pattern === 'stripes'
        ? `repeating-linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.18) 0 1px,
            transparent 1px 5px
          )`
        : 'none'};
    mix-blend-mode: ${({ $pattern }) => ($pattern ? 'soft-light' : 'normal')};
  }

  &::after {
    content: '';
    display: block;
    position: absolute;
    inset: 0;
    left: 0;
    width: 46%;
    z-index: 0;
    pointer-events: none;
    opacity: ${({ $fg }) => ($fg === '#ffffff' ? 0.14 : 0.44)};
    background:
      repeating-linear-gradient(
        121deg,
        transparent 0 11px,
        rgba(255, 255, 255, 0.42) 11px 12px,
        transparent 12px 24px
      ),
      radial-gradient(ellipse 98% 145% at -8% 50%, rgba(255, 255, 255, 0.78), transparent 58%),
      radial-gradient(ellipse 48% 88% at 10% 26%, rgba(255, 255, 255, 0.38), transparent 54%);
    mix-blend-mode: soft-light;
  }

  & > * {
    position: relative;
    z-index: 1;
  }

  @media (max-width: 640px) {
    grid-template-columns: minmax(34px, 1fr) 26px 26px 26px minmax(46px, 1fr);
    padding: 0.14rem 0.16rem 0.14rem 0.12rem;
    margin-left: -6px;
    font-size: 0.58rem;
    gap: 0 0.09rem;
  }

  @media (max-width: 380px) {
    grid-template-columns: minmax(30px, 1fr) 23px 23px 23px minmax(42px, 1fr);
    font-size: 0.54rem;
    padding: 0.12rem 0.12rem 0.12rem 0.1rem;
  }
`;

const TeamAbbrCell = styled.span`
  display: flex;
  align-items: center;
  gap: 0.28rem;
  min-width: 0;
  padding-left: 0.15rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  justify-self: start;
  align-self: center;
  color: ${({ $abbrInk }) => $abbrInk ?? 'inherit'};

  @media (max-width: 640px) {
    gap: 0.18rem;
  }
`;

const StatCell = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  justify-self: stretch;
  width: 100%;
  font-variant-numeric: tabular-nums;
`;

const PtsSlab = styled.div`
  flex: 0 0 54px;
  flex-shrink: 0;
  align-self: stretch;
  width: 54px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #008dce;
  color: #ffffff;
  font-family: var(--font-broadcast), 'Arial Narrow', sans-serif;
  font-style: italic;
  font-weight: 800;
  font-size: clamp(0.82rem, 2.8vw, 1.38rem);
  font-variant-numeric: tabular-nums;
  border-radius: 0 4px 4px 0;
  border-left: 1px solid rgba(255, 255, 255, 0.55);

  @media (max-width: 640px) {
    flex-basis: 40px;
    width: 40px;
    font-size: 0.68rem;
    border-radius: 0 3px 3px 0;
  }

  @media (max-width: 380px) {
    flex-basis: 36px;
    width: 36px;
    font-size: 0.62rem;
  }
`;

const TableFooterNote = styled.div`
  margin-top: 0.55rem;
  padding: 0.55rem 0.65rem;
  background: rgba(12, 35, 68, 0.06);
  border: 1px solid rgba(12, 35, 68, 0.12);
  border-radius: 6px;
  color: #0c2344;
  text-align: center;
  font-size: clamp(0.72rem, 2.4vw, 0.88rem);
  font-family: var(--font-broadcast);
  font-weight: 600;
  font-style: italic;
  letter-spacing: 0.06em;
  text-transform: uppercase;

  @media (max-width: 640px) {
    margin-top: 0.32rem;
    padding: 0.32rem 0.38rem;
    font-size: 0.58rem;
  }
`;

const BroadcastBoardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.28rem;
  padding: 0.12rem 0.05rem 0;
  font-family: var(--font-broadcast), 'Arial Narrow', sans-serif;
  font-size: clamp(0.48rem, 1.65vw, 0.62rem);
  font-weight: 700;
  font-style: italic;
  color: #0a2744;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  opacity: 0.88;

  @media (max-width: 640px) {
    margin-top: 0.18rem;
    font-size: 0.45rem;
  }
`;

const QualifierBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 2px;
  min-width: 17px;
  height: 17px;
  padding: 0 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.95);
  color: #065f46;
  font-size: 9px;
  line-height: 1;
  font-weight: 900;
  letter-spacing: 0.03em;
  flex-shrink: 0;
  border: 1px solid rgba(6, 95, 70, 0.4);
  font-family: var(--font-broadcast), 'Arial Narrow', sans-serif;
  font-style: italic;
`;

const EliminatedBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 2px;
  min-width: 17px;
  height: 17px;
  padding: 0 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.95);
  color: #991b1b;
  font-size: 9px;
  line-height: 1;
  font-weight: 900;
  letter-spacing: 0.03em;
  flex-shrink: 0;
  border: 1px solid rgba(153, 27, 27, 0.4);
  font-family: var(--font-broadcast), 'Arial Narrow', sans-serif;
  font-style: italic;
`;

// Team Details Modal Styles ---------------------------------
const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(6px);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: clamp(0.75rem, 3vw, 2rem);
  overflow-y: auto;
  z-index: 9999;
  animation: pt-fade 0.2s ease-out;

  @keyframes pt-fade {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ModalContent = styled.div`
  background: ${({ $themePrimary, $themeSecondary }) =>
    $themePrimary && $themeSecondary
      ? `linear-gradient(145deg, rgba(2, 6, 23, 0.62) 0%, rgba(2, 6, 23, 0.78) 100%),
         linear-gradient(145deg, ${$themePrimary} 0%, ${$themeSecondary} 58%, #0f172a 100%)`
      : '#ffffff'};
  border-radius: 20px;
  padding: clamp(1rem, 3vw, 1.75rem);
  max-width: 640px;
  width: 100%;
  max-height: calc(100vh - 2rem);
  overflow-y: auto;
  box-shadow: ${({ $themePrimary }) =>
    $themePrimary
      ? `0 30px 70px -22px ${$themePrimary}, 0 18px 40px -24px rgba(15, 23, 42, 0.8)`
      : '0 30px 60px -20px rgba(15, 23, 42, 0.45)'};
  animation: pt-pop 0.25s ease-out;
  -webkit-overflow-scrolling: touch;
  margin: auto;
  color: ${({ $textColor }) => $textColor || '#0f172a'};
  position: relative;
  overflow-x: hidden;
  overflow-y: auto;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 18% 12%, rgba(255,255,255,0.18), transparent 30%),
      radial-gradient(circle at 88% 88%, rgba(255,255,255,0.1), transparent 34%);
    pointer-events: none;
  }

  > * {
    position: relative;
    z-index: 1;
  }

  @keyframes pt-pop {
    from { transform: translateY(12px) scale(0.98); opacity: 0; }
    to { transform: translateY(0) scale(1); opacity: 1; }
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
  padding-bottom: 0.85rem;
  border-bottom: 1px dashed ${({ $textColor }) =>
    $textColor === '#ffffff' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(15, 23, 42, 0.22)'};
`;

const ModalTitle = styled.h2`
  margin: 0;
  color: ${({ $textColor }) => $textColor || '#0f172a'};
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 0;
  font-size: clamp(1rem, 3.5vw, 1.2rem);
  font-weight: 800;
  letter-spacing: -0.01em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  img {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #ffffff;
    box-shadow: 0 6px 14px -8px rgba(15, 23, 42, 0.4);
    flex-shrink: 0;
  }
`;

const CloseButton = styled.button`
  background: linear-gradient(135deg, #ef4444, #b91c1c);
  color: #ffffff;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  cursor: pointer;
  font-size: 20px;
  font-weight: 600;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 10px 20px -12px rgba(239, 68, 68, 0.6);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 14px 26px -12px rgba(239, 68, 68, 0.7);
  }
`;

const TeamStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.5rem;

  @media (max-width: 520px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.5rem;
  }
`;

const StatCard = styled.div`
  background: ${({ $textColor }) =>
    $textColor === '#ffffff'
      ? 'rgba(255, 255, 255, 0.16)'
      : 'rgba(255, 255, 255, 0.82)'};
  padding: 0.75rem;
  border-radius: 12px;
  text-align: center;
  border: 1px solid ${({ $textColor }) =>
    $textColor === '#ffffff' ? 'rgba(255, 255, 255, 0.28)' : 'rgba(148, 163, 184, 0.25)'};
  border-left: 4px solid ${props => props.$accentColor || '#6366f1'};
  box-shadow: 0 6px 16px -12px rgba(15, 23, 42, 0.3);
  transition: transform 0.15s ease;

  &:hover {
    transform: translateY(-2px);
  }
`;

const StatValue = styled.div`
  font-size: clamp(1.2rem, 4vw, 1.55rem);
  font-weight: 900;
  color: ${({ $textColor }) => $textColor || '#0f172a'};
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
`;

const StatLabel = styled.div`
  font-size: 0.72rem;
  color: ${({ $textColor }) => $textColor === '#ffffff' ? 'rgba(255, 255, 255, 0.78)' : '#64748b'};
  margin-top: 0.25rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const MatchTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 0.75rem;
  font-size: 0.88rem;

  @media (max-width: 520px) {
    display: block;
    thead { display: none; }
    tbody { display: block; }
  }
`;

const MatchTableHead = styled.thead`
  background: ${({ $textColor }) =>
    $textColor === '#ffffff' ? 'rgba(255, 255, 255, 0.14)' : 'rgba(248, 250, 252, 0.86)'};
  font-weight: 700;
`;

const MatchTableRow = styled.tr`
  border-bottom: 1px solid ${({ $textColor }) =>
    $textColor === '#ffffff' ? 'rgba(255, 255, 255, 0.18)' : 'rgba(148, 163, 184, 0.25)'};
  transition: background-color 0.15s ease;

  &:hover {
    background-color: ${({ $textColor }) =>
      $textColor === '#ffffff' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(99, 102, 241, 0.05)'};
  }

  @media (max-width: 520px) {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 0.35rem 0.75rem;
    align-items: center;
    padding: 0.6rem 0.75rem;
    margin-bottom: 0.5rem;
    border: 1px solid ${({ $textColor }) =>
      $textColor === '#ffffff' ? 'rgba(255, 255, 255, 0.22)' : 'rgba(148, 163, 184, 0.25)'};
    border-radius: 10px;
    background: ${({ $textColor }) =>
      $textColor === '#ffffff' ? 'rgba(255, 255, 255, 0.12)' : '#ffffff'};
  }
`;

const MatchTableCell = styled.td`
  padding: 0.65rem 0.55rem;
  text-align: left;
  color: ${({ $textColor }) => $textColor || '#0f172a'};

  &:first-child {
    font-weight: 700;
  }

  @media (max-width: 520px) {
    padding: 0 !important;
    font-size: 0.85rem;

    &:nth-child(1) { grid-column: 1; grid-row: 1; }
    &:nth-child(2) { grid-column: 2; grid-row: 1; }
    &:nth-child(3) {
      grid-column: 1;
      grid-row: 2;
      color: ${({ $textColor }) => $textColor === '#ffffff' ? 'rgba(255, 255, 255, 0.72)' : '#64748b'};
      font-size: 0.78rem;
    }
    &:nth-child(4) { grid-column: 2; grid-row: 2; }
  }
`;

const MatchTableHeader = styled.th`
  padding: 0.65rem 0.55rem;
  text-align: left;
  font-weight: 700;
  font-size: 0.72rem;
  color: ${({ $textColor }) => $textColor === '#ffffff' ? 'rgba(255, 255, 255, 0.72)' : '#64748b'};
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const ResultCell = styled(MatchTableCell)`
  color: ${props =>
    props.$result === 'win'
      ? (props.$textColor === '#ffffff' ? '#bbf7d0' : '#047857')
      : props.$result === 'loss'
      ? (props.$textColor === '#ffffff' ? '#fecaca' : '#b91c1c')
      : (props.$textColor === '#ffffff' ? 'rgba(255, 255, 255, 0.78)' : '#64748b')};
  font-weight: 800;

  @media (max-width: 520px) {
    text-align: right;
    font-size: 0.85rem;
  }
`;

const FairnessCell = styled(MatchTableCell)`
  text-align: center;
  font-weight: 700;
  font-variant-numeric: tabular-nums;

  @media (max-width: 520px) {
    text-align: right;

    &::before {
      content: 'Fair ';
      font-size: 0.62rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: ${({ $textColor }) => $textColor === '#ffffff' ? 'rgba(255, 255, 255, 0.7)' : '#64748b'};
      margin-right: 0.25rem;
    }
  }
`;

const normalizeThemeHex = (value) =>
  /^#[0-9a-f]{6}$/i.test(String(value || '').trim()) ? String(value).trim() : null;

const THEME_FALLBACK_PALETTES = [
  ['#0f2744', '#eab308'],
  ['#1e40af', '#dc2626'],
  ['#4c1d95', '#fbbf24'],
  ['#0d9488', '#111827'],
  ['#b45309', '#1c1917'],
  ['#be123c', '#0c4a6e'],
  ['#166534', '#fef08a'],
  ['#7c2d12', '#fde68a'],
];

function hashThemeFallback(teamName) {
  let h = 0;
  const s = teamName || '';
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
  const pair = THEME_FALLBACK_PALETTES[Math.abs(h) % THEME_FALLBACK_PALETTES.length];
  return { primary: pair[0], secondary: pair[1] };
}

function resolveTeamTheme(team) {
  const p = normalizeThemeHex(team?.themePrimary);
  const s = normalizeThemeHex(team?.themeSecondary);
  const label = team?.teamName || team?.originalTeamName || '';
  if (p && s) return { primary: p, secondary: s };
  if (p && !s) return { primary: p, secondary: p };
  return hashThemeFallback(label);
}

function mixHex(hexA, hexB, t) {
  const a = normalizeThemeHex(hexA);
  const b = normalizeThemeHex(hexB);
  if (!a) return '#1e293b';
  if (!b) return a;
  const parse = (h) => [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  const blend = (x, y) => Math.round(x + (y - x) * t);
  const r = blend(ar, br).toString(16).padStart(2, '0');
  const g = blend(ag, bg).toString(16).padStart(2, '0');
  const bl = blend(ab, bb).toString(16).padStart(2, '0');
  return `#${r}${g}${bl}`;
}

const hexLuminance = (hex) => {
  const normalized = normalizeThemeHex(hex);
  if (!normalized) return 0.12;
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  const srgb = [r, g, b].map((value) => {
    const channel = value / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
};

function wcagContrastRatio(bgHex, fgHex) {
  const L = (hex) => {
    const n = normalizeThemeHex(hex);
    if (!n) return 0;
    return hexLuminance(n);
  };
  const Lbg = L(bgHex);
  const Lfg = L(fgHex);
  const lighter = Math.max(Lbg, Lfg);
  const darker = Math.min(Lbg, Lfg);
  return (lighter + 0.05) / (darker + 0.05);
}

/** IPL-style: full theme gradient + WCAG ink (dark strip → white; light strip → navy/black). */
function broadcastRowPresentation(primary, secondary) {
  const p = normalizeThemeHex(primary) || '#2563eb';
  const s = normalizeThemeHex(secondary || primary) || p;
  const lp = hexLuminance(p);
  const ls = hexLuminance(s);
  const lumAvg = (lp + ls) / 2;

  const stripFill = `linear-gradient(92deg, ${p} 0%, ${mixHex(p, s, 0.42)} 52%, ${s} 100%)`;
  const mid = mixHex(p, s, 0.5);
  const lumMid = hexLuminance(mid);

  const cw = wcagContrastRatio(mid, '#ffffff');
  const cd = wcagContrastRatio(mid, '#0a1f44');
  let stripInk = cw >= cd ? '#ffffff' : '#0a1f44';

  if (cw < 3.2 && cd >= cw) stripInk = '#0a1f44';
  if (cd < 3.2 && cw > cd) stripInk = '#ffffff';

  const veryLightTeam = lumAvg > 0.78 || (lp > 0.74 && ls > 0.74);
  const abbrInk =
    stripInk === '#ffffff'
      ? '#ffffff'
      : veryLightTeam || lumMid > 0.74
        ? '#0c0c0c'
        : stripInk;

  const slabDark = mixHex(p, '#061526', 0.74);

  return {
    stripFill,
    stripInk,
    abbrInk,
    slabDark,
    lightStrip: stripInk === '#0a1f44',
  };
}

const getReadableTextColor = (primary, secondary) => {
  const lp = hexLuminance(primary);
  const ls = hexLuminance(secondary || primary);
  return lp > 0.68 && ls > 0.68 ? '#0f172a' : '#ffffff';
};

const calculateRequiredGames = (teamCount, fallback = 13) => {
  const count = Number(teamCount) || 0;
  return count > 1 ? count - 1 : fallback;
};

/** IPL-style board / share: three decimals, no leading "+" on positives */
const formatBoardNRR = (nrr) => {
  if (nrr === null || nrr === undefined || isNaN(nrr)) return '0.000';
  return parseFloat(nrr).toFixed(3);
};

const formatShareNRR = formatBoardNRR;

const broadcastStripPattern = (team) => {
  const key = `${team?.teamName || ''}-${team?._id || ''}`;
  let h = 0;
  for (let i = 0; i < key.length; i += 1) {
    h = (h * 31 + key.charCodeAt(i)) >>> 0;
  }
  const r = h % 5;
  if (r <= 1) return 'waves';
  if (r <= 3) return 'stripes';
  return null;
};

function BroadcastColumnHeaders() {
  return (
    <BroadcastTableHeadRow>
      <BroadcastRankSpacer aria-hidden />
      <BroadcastHeadCard>
        <BroadcastHeadMain>
          <BroadcastHeadLogoSpacer aria-hidden />
          <BroadcastHeadGrid>
            <span>Team</span>
            <span>P</span>
            <span>W</span>
            <span>L</span>
            <span>NRR</span>
          </BroadcastHeadGrid>
        </BroadcastHeadMain>
        <PtsHeadLabel>PTS</PtsHeadLabel>
      </BroadcastHeadCard>
    </BroadcastTableHeadRow>
  );
}

const PointsTable = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('overall');
  const [groups, setGroups] = useState({ A: [], B: [] });
  const [activeTab, setActiveTab] = useState('overall');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamFixtures, setTeamFixtures] = useState([]);
  const [showTeamDetails, setShowTeamDetails] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const pointsTableShareRef = useRef(null);

  const [worldCupMode, setWorldCupMode] = useState(false);
  const NUM_QUALIFIERS = worldCupMode ? 8 : 6; // top-8 if World Cup enabled, top-6 otherwise
  const GROUP_MATCHES = 6; // matches per team in group stage
  const GROUP_QUALIFIERS = 3; // top-3 qualify from each group

  useEffect(() => {
    fetchModeAndData();
  }, []);

  const fetchTeamFixtures = async (teamName) => {
    try {
      const response = await axios.get(`${API_ENDPOINTS}/api/fixtures`);
      const allFixtures = response.data;
      
      // Filter fixtures where the team is either team1 or team2
      const teamMatches = allFixtures.filter(fixture => 
        fixture.team1 === teamName || fixture.team2 === teamName
      );
      
      // Sort: completed matches first (by creation date), then pending matches
      teamMatches.sort((a, b) => {
        const aHasResult = !!a.winner;
        const bHasResult = !!b.winner;
        
        // If one has result and other doesn't, prioritize the one with result
        if (aHasResult && !bHasResult) return -1;
        if (!aHasResult && bHasResult) return 1;
        
        // If both have same status, sort by creation date (most recent first)
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      
      setTeamFixtures(teamMatches);
    } catch (error) {
      console.error("Error fetching team fixtures:", error);
      setTeamFixtures([]);
    }
  };

  const handleTeamClick = async (team) => {
    setSelectedTeam(team);
    
    // Use the original team name for fixture matching (not the abbreviation)
    const teamNameForFixtures = team.originalTeamName || team.teamName;
    
    await fetchTeamFixtures(teamNameForFixtures);
    setShowTeamDetails(true);
  };

  const closeTeamDetails = () => {
    setShowTeamDetails(false);
    setSelectedTeam(null);
    setTeamFixtures([]);
  };

  const fetchModeAndData = async () => {
    try {
      setLoading(true);
      const settings = await axios.get(`${API_ENDPOINTS}/api/settings`);
      const pmode = settings?.data?.pointsMode || 'overall';
      const wcMode = settings?.data?.worldCupMode === true;
      setMode(pmode);
      setWorldCupMode(wcMode);
      
      // Set default tab based on mode
      if (pmode === 'groups') {
        setActiveTab('groupA');
        const resp = await axios.get(`${API_ENDPOINTS}/api/users/points-table-grouped`);
        setGroups(resp.data?.groups || { A: [], B: [] });
      } else {
        setActiveTab('overall');
        const response = await axios.get(`${API_ENDPOINTS}/api/users/points-table`);
        setTeams(response.data);
      }
    } catch (error) {
      console.error("Error fetching points data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter out placeholder teams once
  const filteredTeams = useMemo(
    () => teams.filter((team) => team.teamName !== "NA"),
    [teams]
  );

  const totalMatches = useMemo(
    () => calculateRequiredGames(filteredTeams.length, 13),
    [filteredTeams.length]
  );

  // Sort teams: eliminated teams go to bottom, others by points
  const sortedTeams = useMemo(() => {
    return [...filteredTeams].sort((a, b) => {
      const pointsA = Number(a.points) || 0;
      const pointsB = Number(b.points) || 0;
      const playedA = Number(a.matchesPlayed) || 0;
      const playedB = Number(b.matchesPlayed) || 0;
      
      // Check if teams are eliminated based on early thresholds
      const isEliminatedA = (
        (playedA >= totalMatches - 1 && pointsA <= 10) ||
        (playedA >= totalMatches - 2 && pointsA <= 8) ||
        (playedA >= totalMatches - 3 && pointsA <= 6) ||
        (playedA >= totalMatches - 4 && pointsA <= 4)
      );
      
      const isEliminatedB = (
        (playedB >= totalMatches - 1 && pointsB <= 10) ||
        (playedB >= totalMatches - 2 && pointsB <= 8) ||
        (playedB >= totalMatches - 3 && pointsB <= 6) ||
        (playedB >= totalMatches - 4 && pointsB <= 4)
      );
      
      // Eliminated teams go to bottom
      if (isEliminatedA && !isEliminatedB) return 1;
      if (!isEliminatedA && isEliminatedB) return -1;
      
      // If both eliminated or both not eliminated, sort by points (descending)
      if (pointsB !== pointsA) return pointsB - pointsA;
      
      // If points are equal, sort by NRR (descending)
      const nrrA = Number(a.nrr) || 0;
      const nrrB = Number(b.nrr) || 0;
      if (nrrB !== nrrA) return nrrB - nrrA;
      
      // If NRR is equal, sort by fairness (descending)
      const fairnessA = Number(a.fairness) || 0;
      const fairnessB = Number(b.fairness) || 0;
      return fairnessB - fairnessA;
    });
  }, [filteredTeams, totalMatches]);

  // Removed unused currentTopMap

  // Mathematical status map (Q/E/NONE) from previous logic (kept for reference, not used when season incomplete)
  const _mathStatusMap = useMemo(() => {
    const result = {};
    if (loading || filteredTeams.length === 0) return result;

    filteredTeams.forEach((team) => {
      const points = Number(team.points) || 0;
      const played = Number(team.matchesPlayed) || 0;
      const remaining = Math.max(0, totalMatches - played);
      const teamMin = points; // lose out
      const teamMax = points + remaining * 2; // win out

      const others = filteredTeams.filter((t) => t._id !== team._id);
      const othersMax = others
        .map((t) => {
          const tp = Number(t.points) || 0;
          const pl = Number(t.matchesPlayed) || 0;
          const rem = Math.max(0, totalMatches - pl);
          return tp + rem * 2;
        })
        .sort((a, b) => b - a);

      const othersCurrent = others
        .map((t) => Number(t.points) || 0)
        .sort((a, b) => b - a);

      const kthIndex = NUM_QUALIFIERS - 1;
      const kthMax = othersMax[kthIndex];
      const kthCurrent = othersCurrent[kthIndex];

      const clinched = othersMax.length < NUM_QUALIFIERS
        ? true
        : teamMin > (kthMax ?? -Infinity); // must be strictly greater than others' best

      const eliminated = othersCurrent.length >= NUM_QUALIFIERS
        ? teamMax < (kthCurrent ?? Infinity) // strictly less than current kth team's points
        : false;

      result[team._id] = clinched ? 'Q' : eliminated ? 'E' : 'NONE';
    });

    return result;
  }, [filteredTeams, totalMatches, NUM_QUALIFIERS, loading]);

  // Season completion flag: everyone played all matches
  const allCompleted = useMemo(() => {
    if (filteredTeams.length === 0) return false;
    return filteredTeams.every(t => Number(t.matchesPlayed) >= totalMatches);
  }, [filteredTeams, totalMatches]);

  // Group completion flag: everyone in groups played all group matches
  const groupsCompleted = useMemo(() => {
    if (mode !== 'groups' || Object.keys(groups).length === 0) return false;
    const allGroupTeams = [...groups.A, ...groups.B];
    if (allGroupTeams.length === 0) return false;
    return allGroupTeams.every(t => Number(t.matchesPlayed) >= GROUP_MATCHES);
  }, [groups, mode, GROUP_MATCHES]);

  // Top-N map at completion (used when allCompleted)
  const _completedTopMap = useMemo(() => {
    const ids = {};
    if (!allCompleted) return ids;
    const sorted = [...filteredTeams].sort((a, b) => {
      const pa = Number(a.points) || 0;
      const pb = Number(b.points) || 0;
      if (pb !== pa) return pb - pa;
      const fa = Number(a.fairness) || 0;
      const fb = Number(b.fairness) || 0;
      return fb - fa;
    });
    sorted.slice(0, NUM_QUALIFIERS).forEach((t) => { ids[t._id] = true; });
    return ids;
  }, [allCompleted, filteredTeams, NUM_QUALIFIERS]);

  const renderBroadcastRows = (list) => {
    const qualifiers = mode === 'groups' ? GROUP_QUALIFIERS : NUM_QUALIFIERS;

    return (
      <>
        {list.map((team, index) => {
          const mp = Number(team.matchesPlayed) || 0;
          const w = Number(team.wins) || 0;
          const l = Math.max(0, mp - w);
          const teamImage = team.teamImage
            ? `${API_ENDPOINTS}${team.teamImage}`
            : 'https://via.placeholder.com/100';
          const { primary: tp, secondary: ts } = resolveTeamTheme(team);
          const bp = broadcastRowPresentation(tp, ts);

          const points = Number(team.points) || 0;
          const playedNow = Number(team.matchesPlayed) || 0;

          let showQ = false;
          let showE = false;
          let qTitle = '';
          let eTitle = '';

          if (mode === 'groups') {
            if (groupsCompleted) {
              showQ = index < GROUP_QUALIFIERS;
              showE = index >= GROUP_QUALIFIERS;
              qTitle = 'Qualified (Top 3)';
              eTitle = 'Eliminated';
            } else {
              const earlyEliminated = (
                (playedNow >= 6 && points <= 4) ||
                (playedNow >= 5 && points <= 3) ||
                (playedNow >= 4 && points <= 2) ||
                (playedNow >= 3 && points <= 1)
              );
              showQ = points > 10;
              showE = earlyEliminated;
              qTitle = 'Qualified (10+ points)';
              eTitle = 'Eliminated (early threshold)';
            }
          } else if (allCompleted) {
            showQ = index < NUM_QUALIFIERS;
            showE = index >= NUM_QUALIFIERS;
            qTitle = worldCupMode ? 'Qualified (Top 8)' : 'Qualified (Top 6)';
            eTitle = 'Eliminated';
          } else {
            const earlyEliminated = (
              (playedNow >= totalMatches - 1 && points <= 10) ||
              (playedNow >= totalMatches - 2 && points <= 8) ||
              (playedNow >= totalMatches - 3 && points <= 6) ||
              (playedNow >= totalMatches - 4 && points <= 4)
            );
            showQ = playedNow >= totalMatches && points >= 18;
            showE = earlyEliminated;
            qTitle = `Qualified (${totalMatches} games, 18+ pts)`;
            eTitle = 'Eliminated (early threshold)';
          }

          const stripPat = broadcastStripPattern(team);

          return (
            <BroadcastRowWrap
              key={team._id || `${team.teamName}-${index}`}
              $qualifierBoundary={index === qualifiers - 1}
            >
              <BroadcastCard
                role="button"
                tabIndex={0}
                onClick={() => handleTeamClick(team)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleTeamClick(team);
                  }
                }}
              >
                <BroadcastRankPanel>{index + 1}</BroadcastRankPanel>
                <BroadcastCardMain>
                  <LogoSlab $dark={bp.slabDark}>
                    <img src={teamImage} alt={team.teamName || 'Team'} />
                  </LogoSlab>
                  <StatsStrip
                    $fill={bp.stripFill}
                    $fg={bp.stripInk}
                    $lightStrip={bp.lightStrip}
                    $pattern={stripPat}
                  >
                    <TeamAbbrCell $abbrInk={bp.abbrInk}>
                      {team.teamName}
                      {showQ ? (
                        <QualifierBadge title={qTitle}>Q</QualifierBadge>
                      ) : showE ? (
                        <EliminatedBadge title={eTitle}>E</EliminatedBadge>
                      ) : null}
                    </TeamAbbrCell>
                    <StatCell>{mp}</StatCell>
                    <StatCell>{w}</StatCell>
                    <StatCell>{l}</StatCell>
                    <StatCell>{formatBoardNRR(team.nrr)}</StatCell>
                  </StatsStrip>
                </BroadcastCardMain>
                <PtsSlab>
                  {String(Math.max(0, Number(team.points) || 0)).padStart(2, '0')}
                </PtsSlab>
              </BroadcastCard>
            </BroadcastRowWrap>
          );
        })}
      </>
    );
  };

  const selectedResolved = selectedTeam ? resolveTeamTheme(selectedTeam) : null;
  const selectedThemePrimary = selectedResolved?.primary || null;
  const selectedThemeSecondary = selectedResolved?.secondary || selectedThemePrimary;
  const selectedTextColor = getReadableTextColor(selectedThemePrimary, selectedThemeSecondary);
  const selectedMutedColor = selectedTextColor === '#ffffff'
    ? 'rgba(255, 255, 255, 0.76)'
    : '#475569';

  const handleSharePointsTable = async (title, list, qualifiers) => {
    const rows = list.map((team, index) => {
      const mp = Number(team.matchesPlayed) || 0;
      const w = Number(team.wins) || 0;
      const l = Math.max(0, mp - w);
      const points = String(Math.max(0, Number(team.points) || 0)).padStart(2, '0');
      return `${index + 1}. ${team.teamName} | P:${mp} W:${w} L:${l} PTS:${points} NRR:${formatShareNRR(team.nrr)}`;
    });

    const message = [
      `*${title.toUpperCase()}*`,
      '',
      ...rows,
      '',
      `Top ${qualifiers} teams qualify for playoffs`,
      window.location.href
    ].join('\n');

    try {
      setIsSharing(true);

      if (pointsTableShareRef.current && navigator.share) {
        const canvas = await html2canvas(pointsTableShareRef.current, {
          backgroundColor: '#e5e8ec',
          scale: Math.min(2, window.devicePixelRatio || 1),
          useCORS: true,
          allowTaint: false,
          logging: false,
        });

        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 0.95));
        if (blob) {
          const file = new File([blob], `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`, {
            type: 'image/png',
          });
          if (!navigator.canShare || navigator.canShare({ files: [file] })) {
            await navigator.share({
              title,
              text: `Sharing ${title}`,
              files: [file],
            });
            return;
          }
        }
      }

      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    } catch (error) {
      if (error?.name !== 'AbortError') {
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <>
      {mode === 'groups' ? (
        // Group mode - show tabs for Group A, Group B, and Playoffs
        <TabContainer>
          <TabHeader>
            <TabButton 
              active={activeTab === 'groupA'} 
              onClick={() => setActiveTab('groupA')}
            >
              Group A
            </TabButton>
            <TabButton 
              active={activeTab === 'groupB'} 
              onClick={() => setActiveTab('groupB')}
            >
              Group B
            </TabButton>
            <TabButton 
              active={activeTab === 'playoffs'} 
              onClick={() => setActiveTab('playoffs')}
            >
              Playoffs
            </TabButton>
          </TabHeader>
          
          <TableWrapper>
            {activeTab === 'groupA' && (
              <TableCaptureArea ref={pointsTableShareRef}>
                <BroadcastTitleStack>
                  <BroadcastSeasonLine>
                    {worldCupMode ? 'WORLD CUP' : 'CPL'} · GROUP A
                  </BroadcastSeasonLine>
                </BroadcastTitleStack>
                <BroadcastHeroRow>
                  <BroadcastSkewTitle>
                    <span>POINTS TABLE</span>
                  </BroadcastSkewTitle>
                  <WhatsAppShareButton
                    type="button"
                    data-html2canvas-ignore="true"
                    disabled={isSharing}
                    onClick={() => handleSharePointsTable('CPL Group A Points Table', groups.A, GROUP_QUALIFIERS)}
                  >
                    <FaWhatsapp /> <span>{isSharing ? 'Sharing' : 'Share'}</span>
                  </WhatsAppShareButton>
                </BroadcastHeroRow>
                <BroadcastColumnHeaders />
                {renderBroadcastRows(groups.A)}
                <BroadcastBoardFooter>
                  <span>{worldCupMode ? 'WORLD CUP' : 'CPL'} TABLE</span>
                  <span>#POINTS</span>
                </BroadcastBoardFooter>
                <TableFooterNote>Top {GROUP_QUALIFIERS} Teams Qualify For Playoffs</TableFooterNote>
              </TableCaptureArea>
            )}
            
            {activeTab === 'groupB' && (
              <TableCaptureArea ref={pointsTableShareRef}>
                <BroadcastTitleStack>
                  <BroadcastSeasonLine>
                    {worldCupMode ? 'WORLD CUP' : 'CPL'} · GROUP B
                  </BroadcastSeasonLine>
                </BroadcastTitleStack>
                <BroadcastHeroRow>
                  <BroadcastSkewTitle>
                    <span>POINTS TABLE</span>
                  </BroadcastSkewTitle>
                  <WhatsAppShareButton
                    type="button"
                    data-html2canvas-ignore="true"
                    disabled={isSharing}
                    onClick={() => handleSharePointsTable('CPL Group B Points Table', groups.B, GROUP_QUALIFIERS)}
                  >
                    <FaWhatsapp /> <span>{isSharing ? 'Sharing' : 'Share'}</span>
                  </WhatsAppShareButton>
                </BroadcastHeroRow>
                <BroadcastColumnHeaders />
                {renderBroadcastRows(groups.B)}
                <BroadcastBoardFooter>
                  <span>{worldCupMode ? 'WORLD CUP' : 'CPL'} TABLE</span>
                  <span>#POINTS</span>
                </BroadcastBoardFooter>
                <TableFooterNote>Top {GROUP_QUALIFIERS} Teams Qualify For Playoffs</TableFooterNote>
              </TableCaptureArea>
            )}
            
            {activeTab === 'playoffs' && (
              <PlayoffFixtures 
                top6Teams={mode === 'groups' ? 
                  [...groups.A.slice(0, 3), ...groups.B.slice(0, 3)] : 
                  sortedTeams.slice(0, 6)
                } 
                mode={mode}
                groups={groups}
              />
            )}
          </TableWrapper>
        </TabContainer>
      ) : (
        // Overall mode - show tabs for Overall Table and Playoffs
        <TabContainer>
          <TabHeader>
            <TabButton 
              active={activeTab === 'overall'} 
              onClick={() => setActiveTab('overall')}
            >
              Overall Table
            </TabButton>
            <TabButton 
              active={activeTab === 'playoffs'} 
              onClick={() => setActiveTab('playoffs')}
            >
              Playoffs
            </TabButton>
          </TabHeader>
          
          <TableWrapper>
            {activeTab === 'overall' && (
              <TableCaptureArea ref={pointsTableShareRef}>
                <BroadcastTitleStack>
                  <BroadcastSeasonLine>
                    {worldCupMode ? 'WORLD CUP' : 'CPL'} · OVERALL STANDINGS
                  </BroadcastSeasonLine>
                </BroadcastTitleStack>
                <BroadcastHeroRow>
                  <BroadcastSkewTitle>
                    <span>POINTS TABLE</span>
                  </BroadcastSkewTitle>
                  <WhatsAppShareButton
                    type="button"
                    data-html2canvas-ignore="true"
                    disabled={isSharing}
                    onClick={() => handleSharePointsTable('CPL Points Table', sortedTeams, NUM_QUALIFIERS)}
                  >
                    <FaWhatsapp /> <span>{isSharing ? 'Sharing' : 'Share'}</span>
                  </WhatsAppShareButton>
                </BroadcastHeroRow>
                <BroadcastColumnHeaders />
                {renderBroadcastRows(sortedTeams)}
                <BroadcastBoardFooter>
                  <span>{worldCupMode ? 'WORLD CUP' : 'CPL'} TABLE</span>
                  <span>#POINTS</span>
                </BroadcastBoardFooter>
                <TableFooterNote>Top {NUM_QUALIFIERS} Teams Qualify For Playoffs</TableFooterNote>
              </TableCaptureArea>
            )}
            
            {activeTab === 'playoffs' && (
              <PlayoffFixtures 
                top6Teams={sortedTeams.slice(0, NUM_QUALIFIERS)} 
                mode={mode}
                groups={groups}
              />
            )}
          </TableWrapper>
        </TabContainer>
      )}

      {/* Team Details Modal */}
      {showTeamDetails && selectedTeam && (
        <ModalOverlay onClick={closeTeamDetails}>
          <ModalContent
            $themePrimary={selectedThemePrimary}
            $themeSecondary={selectedThemeSecondary}
            $textColor={selectedTextColor}
            onClick={(e) => e.stopPropagation()}
          >
            <ModalHeader $textColor={selectedTextColor}>
              <ModalTitle $textColor={selectedTextColor}>
                <img 
                  src={selectedTeam.teamImage ? `${API_ENDPOINTS}${selectedTeam.teamImage}` : "https://via.placeholder.com/100"} 
                  alt={selectedTeam.teamName} 
                />
                {selectedTeam.teamName} - Match Details
              </ModalTitle>
              <CloseButton onClick={closeTeamDetails}>×</CloseButton>
            </ModalHeader>

            <TeamStats>
              <StatCard $accentColor="#28a745" $textColor={selectedTextColor}>
                <StatValue $textColor={selectedTextColor}>{selectedTeam.wins}</StatValue>
                <StatLabel $textColor={selectedTextColor}>Wins</StatLabel>
              </StatCard>
              <StatCard $accentColor="#dc3545" $textColor={selectedTextColor}>
                <StatValue $textColor={selectedTextColor}>{selectedTeam.losses}</StatValue>
                <StatLabel $textColor={selectedTextColor}>Losses</StatLabel>
              </StatCard>
              <StatCard $accentColor="#007bff" $textColor={selectedTextColor}>
                <StatValue $textColor={selectedTextColor}>{selectedTeam.points}</StatValue>
                <StatLabel $textColor={selectedTextColor}>Points</StatLabel>
              </StatCard>
              <StatCard $accentColor="#ffc107" $textColor={selectedTextColor}>
                <StatValue $textColor={selectedTextColor}>{selectedTeam.fairness}</StatValue>
                <StatLabel $textColor={selectedTextColor}>Fairness</StatLabel>
              </StatCard>
              <StatCard $accentColor="#6c757d" $textColor={selectedTextColor}>
                <StatValue $textColor={selectedTextColor}>{selectedTeam.matchesPlayed}</StatValue>
                <StatLabel $textColor={selectedTextColor}>Matches Played</StatLabel>
              </StatCard>
            </TeamStats>

            <h3 style={{ color: selectedTextColor, marginBottom: '1rem' }}>Match History</h3>
            {teamFixtures.length > 0 ? (
              <MatchTable>
                <MatchTableHead $textColor={selectedTextColor}>
                  <tr>
                    <MatchTableHeader $textColor={selectedTextColor}>Opponent</MatchTableHeader>
                    <MatchTableHeader $textColor={selectedTextColor}>Result</MatchTableHeader>
                    <MatchTableHeader $textColor={selectedTextColor}>Date</MatchTableHeader>
                    <MatchTableHeader $textColor={selectedTextColor}>Fairness</MatchTableHeader>
                  </tr>
                </MatchTableHead>
                <tbody>
                  {teamFixtures.map((fixture, index) => {
                    const isTeam1 = fixture.team1 === selectedTeam.originalTeamName;
                    const opponent = isTeam1 ? fixture.team2 : fixture.team1;
                    
                    let result = 'vs';
                    let resultText = 'vs';
                    
                    if (fixture.winner) {
                      if (fixture.winner === selectedTeam.originalTeamName) {
                        result = 'win';
                        resultText = 'Won';
                        if (fixture.margin) {
                          resultText += ` by ${fixture.margin}`;
                        }
                      } else {
                        result = 'loss';
                        resultText = 'Lost';
                        if (fixture.margin) {
                          resultText += ` by ${fixture.margin}`;
                        }
                      }
                    }

                    // Format date
                    const matchDate = new Date(fixture.createdAt).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short'
                    });

                    // Get fairness for this team
                    const teamFairness = isTeam1 ? fixture.team1Fairness : fixture.team2Fairness;

                    return (
                      <MatchTableRow key={index} $textColor={selectedTextColor}>
                        <MatchTableCell $textColor={selectedTextColor}>{opponent}</MatchTableCell>
                        <ResultCell $result={result} $textColor={selectedTextColor}>{resultText}</ResultCell>
                        <MatchTableCell $textColor={selectedTextColor}>{matchDate}</MatchTableCell>
                        <FairnessCell $textColor={selectedTextColor}>{teamFairness || '-'}</FairnessCell>
                      </MatchTableRow>
                    );
                  })}
                </tbody>
              </MatchTable>
            ) : (
              <div style={{ textAlign: 'center', color: selectedMutedColor, padding: '2rem' }}>
                No matches found for this team.
              </div>
            )}
          </ModalContent>
        </ModalOverlay>
      )}
    </>
  );
};

export default PointsTable;