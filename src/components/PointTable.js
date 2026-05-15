import React, { useEffect, useState } from "react";
import styled from "styled-components";
import axios from "axios";
import { API_ENDPOINTS } from "../const";
import { useMemo } from "react";
import PlayoffFixtures from "./PlayoffFixtures";
import { FaWhatsapp } from "react-icons/fa";

/* =========================================================
   Points Table — mobile-first redesign
   Same JSX/state/logic; only the styled-components change.
   On narrow screens each row becomes a compact grid-card so
   the whole table fits without horizontal scroll and there's
   no inner-table vertical scroll.
   ========================================================= */

// Tab styles -------------------------------------------------
const TabContainer = styled.div`
  margin: 0.75rem auto 2rem;
  width: calc(100% - 1rem);
  max-width: 1100px;
  background:
    radial-gradient(circle at 8% 0%, rgba(56, 189, 248, 0.28), transparent 28%),
    linear-gradient(145deg, #07111f 0%, #0b1830 48%, #050914 100%);
  border-radius: 18px;
  box-shadow: 0 24px 60px -28px rgba(2, 6, 23, 0.85);
  border: 1px solid rgba(125, 211, 252, 0.35);
  overflow: hidden;

  @media (max-width: 600px) {
    width: calc(100% - 0.5rem);
    margin: 0.5rem auto 1.25rem;
    border-radius: 12px;
  }
`;

const TabHeader = styled.div`
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  gap: 0.25rem;
  padding: 0.35rem 0.35rem 0;
  background: linear-gradient(90deg, rgba(15, 23, 42, 0.98), rgba(30, 64, 175, 0.62), rgba(15, 23, 42, 0.98));
  border-bottom: 1px solid rgba(125, 211, 252, 0.3);
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar { display: none; }
`;

const TabButton = styled.button`
  flex: 0 0 auto;
  padding: 0.7rem 1.1rem 0.75rem;
  min-height: 42px;
  background: transparent;
  color: ${props => props.active ? "#ffffff" : "rgba(226, 232, 240, 0.72)"};
  border: none;
  border-bottom: 2px solid ${props => props.active ? "#38bdf8" : "transparent"};
  border-radius: 0;
  font-weight: ${props => props.active ? "700" : "500"};
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease;
  font-size: 0.9rem;
  font-family: var(--font-scoreboard, 'Arial Narrow', 'Arial Black', Impact, sans-serif);
  letter-spacing: 0.08em;
  white-space: nowrap;
  margin-bottom: -1px;

  &:hover { color: #ffffff; }

  @media (max-width: 600px) {
    padding: 0.6rem 0.85rem 0.65rem;
    font-size: 0.82rem;
  }
`;

// Table container --------------------------------------------
const TableWrapper = styled.div`
  padding: clamp(0.5rem, 2vw, 1rem) clamp(0.5rem, 2vw, 1.25rem) clamp(0.75rem, 2vw, 1.25rem);
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.28), rgba(2, 6, 23, 0.72)),
    radial-gradient(circle at 95% 12%, rgba(14, 165, 233, 0.18), transparent 32%);

  h2 {
    margin: 0.15rem 0 0.75rem;
    color: #ffffff !important;
    font-size: clamp(1.25rem, 4.2vw, 2.05rem) !important;
    font-weight: 950;
    letter-spacing: 0.08em;
    font-family: var(--font-scoreboard, 'Arial Narrow', 'Arial Black', Impact, sans-serif) !important;
    text-align: left !important;
    text-transform: uppercase;
    text-shadow: 0 3px 10px rgba(0, 0, 0, 0.65);
  }

  @media (max-width: 600px) {
    padding: 0.5rem 0.5rem 0.75rem;
    overflow: visible;
  }
`;

const TableTitleBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;

  h2 {
    margin-bottom: 0 !important;
  }

  @media (max-width: 600px) {
    align-items: flex-start;
    gap: 0.5rem;
  }
`;

const WhatsAppShareButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  border: 1px solid rgba(187, 247, 208, 0.5);
  border-radius: 999px;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #ffffff;
  padding: 0.45rem 0.8rem;
  font-family: var(--font-scoreboard, 'Arial Narrow', 'Arial Black', Impact, sans-serif);
  font-size: 0.9rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  box-shadow: 0 8px 18px -12px rgba(34, 197, 94, 0.9);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.45);
  white-space: nowrap;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 12px 22px -14px rgba(34, 197, 94, 1);
  }

  @media (max-width: 600px) {
    padding: 0.4rem 0.58rem;
    font-size: 0.76rem;

    span {
      display: none;
    }
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 4px;
  table-layout: fixed;
  font-size: 0.98rem;
  color: #ffffff;
  font-variant-numeric: tabular-nums;
  font-family: var(--font-scoreboard, 'Arial Narrow', 'Arial Black', Impact, sans-serif);

  /* Desktop column widths */
  th:nth-child(1), td:nth-child(1) { width: 46px; text-align: center; }        /* POS */
  th:nth-child(2), td:nth-child(2) { width: auto; min-width: 180px; text-align: left; } /* TEAM */
  th:nth-child(3), td:nth-child(3),
  th:nth-child(4), td:nth-child(4),
  th:nth-child(5), td:nth-child(5) { width: 52px; text-align: right; }         /* P W L */
  th:nth-child(6), td:nth-child(6) { width: 64px; text-align: right; }         /* PTS */
  th:nth-child(7), td:nth-child(7) { width: 80px; text-align: center; padding-right: 0.4rem; } /* NRR */

  @media (max-width: 600px) {
    display: block;
    font-size: 0.8rem;
    border-spacing: 0;

    thead,
    tbody {
      display: block;
      width: 100%;
    }

    th:nth-child(1), td:nth-child(1) { width: 34px; }
    th:nth-child(2), td:nth-child(2) { min-width: 0; }
    th:nth-child(3), td:nth-child(3),
    th:nth-child(4), td:nth-child(4),
    th:nth-child(5), td:nth-child(5) { width: 26px; }
    th:nth-child(6), td:nth-child(6) { width: 36px; }  /* PTS */
    th:nth-child(7), td:nth-child(7) { width: 64px; padding-right: 0.1rem; }  /* NRR */
  }
`;

const TableHead = styled.thead`
  tr {
    background: linear-gradient(90deg, rgba(2, 6, 23, 0.92), rgba(15, 23, 42, 0.82));
  }

  td {
    /* Match body padding exactly so right-aligned headers sit above values. */
    padding: 0.5rem 0.55rem;
    font-size: 0.96rem;
    font-weight: 950;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: rgba(255, 255, 255, 0.86);
    border-bottom: 1px solid rgba(56, 189, 248, 0.45);
    background: transparent;
    text-shadow: 0 2px 6px rgba(0, 0, 0, 0.55);
  }

  td.pts-cell { color: #ffffff; }

  @media (max-width: 600px) {
    tr {
      display: grid;
      grid-template-columns: 34px minmax(118px, 1fr) 26px 26px 26px 38px 62px;
      align-items: center;
      background: linear-gradient(90deg, rgba(2, 6, 23, 0.96), rgba(15, 23, 42, 0.88));
      border-bottom: 1px solid rgba(56, 189, 248, 0.45);
    }

    td {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      min-width: 0;
      padding: 0.45rem 0.18rem;
      font-size: 0.74rem;
      border-bottom: none;
    }

    td:first-child {
      justify-content: center;
    }

    td:nth-child(2) {
      justify-content: flex-start;
    }
  }
`;

const TableRow = styled.tr`
  background: ${({ $themePrimary, $themeSecondary }) =>
    $themePrimary && $themeSecondary
      ? `linear-gradient(90deg, ${$themePrimary} 0%, ${$themeSecondary} 100%)`
      : '#1d4ed8'};
  box-shadow: ${({ $themePrimary }) =>
    $themePrimary
      ? `inset 0 0 0 1px rgba(255,255,255,0.12)`
      : 'inset 0 0 0 1px rgba(255,255,255,0.12)'};
  cursor: pointer;

  td {
    padding: 0.62rem 0.55rem;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
    border-bottom: ${({ $qualifierBoundary }) =>
      $qualifierBoundary ? '2px dashed rgba(255, 255, 255, 0.72)' : '1px solid rgba(2, 6, 23, 0.82)'};
    background: transparent;
    font-weight: 900;
    color: #ffffff;
    vertical-align: middle;
    text-shadow: 0 2px 7px rgba(0, 0, 0, 0.72);
    letter-spacing: 0.07em;
    font-family: var(--font-scoreboard, 'Arial Narrow', 'Arial Black', Impact, sans-serif);
  }

  td:first-child {
    border-radius: 2px 0 0 2px;
    background: transparent;
  }

  td:last-child {
    border-radius: 0 2px 2px 0;
  }

  &:hover {
    filter: brightness(1.04);
  }
  &:hover td {
    background: transparent;
  }
  &:focus { outline: none; }
  &:focus-visible td { outline: 2px solid rgba(56, 189, 248, 0.7); outline-offset: -2px; }
  &:last-child td { border-bottom: none; }

  /* NRR sign colour */
  td.nrr-cell {
    color: #ffffff;
    font-weight: 900;
  }

  /* PTS highlighted — colour depends on qualifying zone */
  td.pts-cell {
    font-weight: 950;
    font-size: 1.08em;
    color: #ffffff;
  }
  td.pts-cell.pts-top,
  td.pts-cell.pts-mid,
  td.pts-cell.pts-low { color: #ffffff; }

  @media (max-width: 600px) {
    display: grid;
    grid-template-columns: 34px minmax(118px, 1fr) 26px 26px 26px 38px 62px;
    align-items: center;
    margin-bottom: 4px;
    border-bottom: ${({ $qualifierBoundary }) =>
      $qualifierBoundary ? '2px dashed rgba(255, 255, 255, 0.78)' : '1px solid rgba(255, 255, 255, 0.08)'};
    border-radius: 0;
    overflow: hidden;

    td {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      min-width: 0;
      height: 48px;
      padding: 0.5rem 0.18rem;
      border: none;
      background: transparent !important;
    }

    td:first-child {
      justify-content: center;
    }

    td:nth-child(2) {
      justify-content: flex-start;
    }

    &:hover td {
      background: transparent !important;
    }

    td.pts-cell { font-size: 1em; }
  }
`;

const TableFooterNote = styled.div`
  margin-top: 0.45rem;
  padding: 0.62rem 0.75rem;
  background: linear-gradient(90deg, rgba(2, 6, 23, 0.92), rgba(15, 23, 42, 0.72), rgba(2, 6, 23, 0.92));
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
  text-align: center;
  font-size: clamp(0.78rem, 2.6vw, 0.95rem);
  font-family: var(--font-scoreboard, 'Arial Narrow', 'Arial Black', Impact, sans-serif);
  font-weight: 400;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-shadow: 0 2px 7px rgba(0, 0, 0, 0.72);
`;

const TableCell = styled.td`
  white-space: nowrap;
`;

const HighlightCell = styled(TableCell)`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  color: #ffffff;
  font-weight: 950;
  min-width: 0;

  tr:hover & .team-name { color: #ffffff; }

  img {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    object-fit: cover;
    background: rgba(255, 255, 255, 0.9);
    flex-shrink: 0;
    border: 1px solid rgba(255, 255, 255, 0.75);
    box-shadow: 0 4px 10px -6px rgba(0, 0, 0, 0.8);
  }

  .team-name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
    transition: color 0.15s ease;
    letter-spacing: 0.08em;
    font-family: Impact, 'Arial Black', var(--font-scoreboard, 'Arial Narrow', sans-serif);
    font-size: 1.25rem;
    font-weight: 900;
    text-transform: uppercase;
    color: #ffffff;
    background: transparent;
    border: none;
    border-radius: 0;
    padding: 0;
    line-height: 1.05;
    text-shadow:
      0 2px 4px rgba(0, 0, 0, 0.95),
      0 0 10px rgba(0, 0, 0, 0.9),
      1px 1px 0 rgba(0, 0, 0, 0.85),
      -1px 1px 0 rgba(0, 0, 0, 0.85);
    -webkit-text-stroke: 0.35px rgba(0, 0, 0, 0.78);
    box-shadow: none;
  }

  @media (max-width: 600px) {
    gap: 0.52rem;
    img { width: 24px; height: 24px; }

    .team-name {
      font-size: 1.08rem;
      letter-spacing: 0.06em;
      padding: 0;
    }
  }
`;

const QualifierBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: #ffffff;
  color: #065f46;
  font-size: 10px;
  line-height: 1;
  font-weight: 950;
  letter-spacing: 0.04em;
  flex-shrink: 0;
  border: 1px solid rgba(6, 95, 70, 0.35);
  box-shadow: 0 2px 8px -4px rgba(0, 0, 0, 0.9);
`;

const EliminatedBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: #ffffff;
  color: #991b1b;
  font-size: 10px;
  line-height: 1;
  font-weight: 950;
  letter-spacing: 0.04em;
  flex-shrink: 0;
  border: 1px solid rgba(153, 27, 27, 0.35);
  box-shadow: 0 2px 8px -4px rgba(0, 0, 0, 0.9);
`;

const RankCell = styled(TableCell)`
  color: #ffffff;
  font-family: Impact, 'Arial Black', var(--font-scoreboard, 'Arial Narrow', sans-serif);
  font-weight: 900;
  text-align: center !important;
  padding-left: 0 !important;
  font-size: 1.22rem;
  letter-spacing: 0.04em;
  text-shadow:
    0 2px 4px rgba(0, 0, 0, 0.95),
    0 0 8px rgba(0, 0, 0, 0.9);
  -webkit-text-stroke: 0;

  @media (max-width: 600px) {
    font-size: 1rem;
    padding-left: 0 !important;
  }
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
      ? `linear-gradient(145deg, ${$themePrimary} 0%, ${$themeSecondary} 58%, #0f172a 100%)`
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
      radial-gradient(circle at 18% 12%, rgba(255,255,255,0.42), transparent 30%),
      radial-gradient(circle at 88% 88%, rgba(255,255,255,0.16), transparent 34%);
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

const getReadableTextColor = (primary, secondary) => {
  const hexToRgb = (hex) => {
    const normalized = normalizeThemeHex(hex);
    if (!normalized) return null;
    return {
      r: parseInt(normalized.slice(1, 3), 16),
      g: parseInt(normalized.slice(3, 5), 16),
      b: parseInt(normalized.slice(5, 7), 16),
    };
  };

  const luminance = (rgb) => {
    if (!rgb) return 1;
    const srgb = [rgb.r, rgb.g, rgb.b].map((value) => {
      const channel = value / 255;
      return channel <= 0.03928
        ? channel / 12.92
        : Math.pow((channel + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
  };

  const primaryLum = luminance(hexToRgb(primary));
  const secondaryLum = luminance(hexToRgb(secondary || primary));
  return (primaryLum + secondaryLum) / 2 < 0.46 ? '#ffffff' : '#0f172a';
};

const calculateRequiredGames = (teamCount, fallback = 13) => {
  const count = Number(teamCount) || 0;
  return count > 1 ? count - 1 : fallback;
};

const formatShareNRR = (nrr) => {
  if (nrr === null || nrr === undefined || isNaN(nrr)) return '0.000';
  const formatted = parseFloat(nrr).toFixed(3);
  return formatted >= 0 ? `+${formatted}` : formatted;
};

const PointsTable = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('overall');
  const [groups, setGroups] = useState({ A: [], B: [] });
  const [activeTab, setActiveTab] = useState('overall');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamFixtures, setTeamFixtures] = useState([]);
  const [showTeamDetails, setShowTeamDetails] = useState(false);

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

  const renderTableBody = (list) => {
    const qualifiers = mode === 'groups' ? GROUP_QUALIFIERS : NUM_QUALIFIERS;
    const totalTeams = list.length;
    const remaining = Math.max(0, totalTeams - qualifiers);
    // Upper half of the remaining rows get yellow, lower half get red.
    // If the remainder is odd, the extra row goes to yellow (nicer for tight tables).
    const yellowCount = Math.ceil(remaining / 2);

    return (
    <tbody>
      {list.map((team, index) => {
        const losses = team.matchesPlayed - team.wins;
        const teamImage = team.teamImage
          ? `${API_ENDPOINTS}${team.teamImage}`
          : "https://via.placeholder.com/100";
        const themePrimary = normalizeThemeHex(team.themePrimary);
        const themeSecondary = normalizeThemeHex(team.themeSecondary);

        const points = Number(team.points) || 0;
        const playedNow = Number(team.matchesPlayed) || 0;

        // Check if team is eliminated based on early thresholds
        const isEliminated = (
          (playedNow >= totalMatches - 1 && points <= 10) ||
          (playedNow >= totalMatches - 2 && points <= 8) ||
          (playedNow >= totalMatches - 3 && points <= 6) ||
          (playedNow >= totalMatches - 4 && points <= 4)
        );

        // Qualification logic based on mode and completion status
        let showQ = false;
        let showE = false;
        let qTitle = "";
        let eTitle = "";

        if (mode === 'groups') {
          // Group mode logic
          if (groupsCompleted) {
            // All teams completed 6 matches - show Q for top 3, E for others
            showQ = index < GROUP_QUALIFIERS;
            showE = index >= GROUP_QUALIFIERS;
            qTitle = "Qualified (Top 3)";
            eTitle = "Eliminated";
          } else {
            // During group stage - use early elimination thresholds
            const earlyEliminated = (
              (playedNow >= 6 && points <= 4) ||
              (playedNow >= 5 && points <= 3) ||
              (playedNow >= 4 && points <= 2) ||
              (playedNow >= 3 && points <= 1)
            );
            showQ = points > 10; // High points during group stage
            showE = earlyEliminated;
            qTitle = "Qualified (10+ points)";
            eTitle = "Eliminated (early threshold)";
          }
        } else {
          // Overall mode logic
          if (allCompleted) {
            // All participating teams completed their round-robin matches - show Q for top 6/8, E for rest.
            showQ = index < NUM_QUALIFIERS;
            showE = index >= NUM_QUALIFIERS;
            qTitle = worldCupMode ? "Qualified (Top 8)" : "Qualified (Top 6)";
            eTitle = "Eliminated";
          } else {
            // During season: progressive Q/E based on participating team count.
            const earlyEliminated = (
              (playedNow >= totalMatches - 1 && points <= 10) ||
              (playedNow >= totalMatches - 2 && points <= 8)  ||
              (playedNow >= totalMatches - 3 && points <= 6)  ||
              (playedNow >= totalMatches - 4 && points <= 4)
            );
            showQ = playedNow >= totalMatches && points >= 18;
            showE = earlyEliminated;
            qTitle = `Qualified (${totalMatches} games, 18+ pts)`;
            eTitle = "Eliminated (early threshold)";
          }
        }

        // Variant logic: different for groups vs overall
        let variant;
        if (mode === 'groups') {
          // Group mode: Top 3 green, E teams red, others yellow
          if (showE) {
            variant = "eliminated"; // Red
          } else if (showQ) {
            variant = "top"; // Green for qualified teams
          } else {
            variant = "middle"; // Yellow for others
          }
        } else {
          // Overall mode: original logic
          if (showE) {
            variant = "eliminated"; // Red card design
          } else if (showQ) {
            variant = "top"; // Green for qualified teams
          } else if (index >= list.length - 3) {
            variant = "bottom";
          } else {
            variant = "middle";
          }
        }

        // Format NRR with proper sign and 3 decimal places
        const formatNRR = (nrr) => {
          if (nrr === null || nrr === undefined || isNaN(nrr)) {
            return '0.000';
          }
          const formatted = parseFloat(nrr).toFixed(3);
          return formatted >= 0 ? `+${formatted}` : formatted;
        };

        return (
          <TableRow
            key={team._id || `${team.teamName}-${index}`}
            index={index}
            variant={variant}
            $themePrimary={themePrimary}
            $themeSecondary={themeSecondary}
            $qualifierBoundary={index === qualifiers - 1}
            onClick={() => handleTeamClick(team)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleTeamClick(team);
              }
            }}
          >
            <RankCell>{index + 1}</RankCell>
            <HighlightCell>
              <img src={teamImage} alt={team.teamName} />
              <span className="team-name">{team.teamName}</span>
              {showQ ? (
                <QualifierBadge title={qTitle}>Q</QualifierBadge>
              ) : showE ? (
                <EliminatedBadge title={eTitle}>E</EliminatedBadge>
              ) : null}
            </HighlightCell>
            <TableCell>{team.matchesPlayed}</TableCell>
            <TableCell>{team.wins}</TableCell>
            <TableCell>{losses}</TableCell>
            <TableCell
              className={`pts-cell ${
                index < qualifiers
                  ? 'pts-top'
                  : (index - qualifiers) < yellowCount
                  ? 'pts-mid'
                  : 'pts-low'
              }`}
            >
              {String(Math.max(0, Number(team.points) || 0)).padStart(2, '0')}
            </TableCell>
            <TableCell className="nrr-cell">{formatNRR(team.nrr)}</TableCell>
          </TableRow>
        );
      })}
    </tbody>
    );
  };

  const selectedThemePrimary = normalizeThemeHex(selectedTeam?.themePrimary);
  const selectedThemeSecondary = normalizeThemeHex(selectedTeam?.themeSecondary) || selectedThemePrimary;
  const selectedTextColor = getReadableTextColor(selectedThemePrimary, selectedThemeSecondary);
  const selectedMutedColor = selectedTextColor === '#ffffff'
    ? 'rgba(255, 255, 255, 0.76)'
    : '#475569';

  const handleSharePointsTable = (title, list, qualifiers) => {
    const rows = list.map((team, index) => {
      const losses = (Number(team.matchesPlayed) || 0) - (Number(team.wins) || 0);
      const points = String(Math.max(0, Number(team.points) || 0)).padStart(2, '0');
      return `${index + 1}. ${team.teamName} | P:${team.matchesPlayed || 0} W:${team.wins || 0} L:${losses} PTS:${points} NRR:${formatShareNRR(team.nrr)}`;
    });

    const message = [
      `*${title.toUpperCase()}*`,
      '',
      ...rows,
      '',
      `Top ${qualifiers} teams qualify for playoffs`,
      window.location.href
    ].join('\n');

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
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
              <>
                <TableTitleBar>
                  <h2 style={{ textAlign: "center", color: "#343a40", marginBottom: "0.5rem", fontSize: "1.2rem", marginTop: "0.5rem" }}>
                    Group A
                  </h2>
                  <WhatsAppShareButton
                    type="button"
                    onClick={() => handleSharePointsTable('CPL Group A Points Table', groups.A, GROUP_QUALIFIERS)}
                  >
                    <FaWhatsapp /> <span>Share</span>
                  </WhatsAppShareButton>
                </TableTitleBar>
                <Table>
                  <TableHead>
                    <tr>
                      <TableCell>POS</TableCell>
                      <TableCell>TEAM</TableCell>
                      <TableCell>P</TableCell>
                      <TableCell>W</TableCell>
                      <TableCell>L</TableCell>
                      <TableCell className="pts-cell">PTS</TableCell>
                      <TableCell className="nrr-cell">NRR</TableCell>
                    </tr>
                  </TableHead>
                  {renderTableBody(groups.A)}
                </Table>
                <TableFooterNote>Top {GROUP_QUALIFIERS} Teams Qualify For Playoffs</TableFooterNote>
              </>
            )}
            
            {activeTab === 'groupB' && (
              <>
                <TableTitleBar>
                  <h2 style={{ textAlign: "center", color: "#343a40", marginBottom: "0.5rem", fontSize: "1.2rem", marginTop: "0.5rem" }}>
                    Group B
                  </h2>
                  <WhatsAppShareButton
                    type="button"
                    onClick={() => handleSharePointsTable('CPL Group B Points Table', groups.B, GROUP_QUALIFIERS)}
                  >
                    <FaWhatsapp /> <span>Share</span>
                  </WhatsAppShareButton>
                </TableTitleBar>
                <Table>
                  <TableHead>
                    <tr>
                      <TableCell>POS</TableCell>
                      <TableCell>TEAM</TableCell>
                      <TableCell>P</TableCell>
                      <TableCell>W</TableCell>
                      <TableCell>L</TableCell>
                      <TableCell className="pts-cell">PTS</TableCell>
                      <TableCell className="nrr-cell">NRR</TableCell>
                    </tr>
                  </TableHead>
                  {renderTableBody(groups.B)}
                </Table>
                <TableFooterNote>Top {GROUP_QUALIFIERS} Teams Qualify For Playoffs</TableFooterNote>
              </>
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
              <>
                <TableTitleBar>
                  <h2 style={{ textAlign: "center", color: "#343a40", marginBottom: "0.5rem", fontSize: "1.2rem", marginTop: "0.5rem" }}>
                    Points Table
                  </h2>
                  <WhatsAppShareButton
                    type="button"
                    onClick={() => handleSharePointsTable('CPL Points Table', sortedTeams, NUM_QUALIFIERS)}
                  >
                    <FaWhatsapp /> <span>Share</span>
                  </WhatsAppShareButton>
                </TableTitleBar>
                <Table>
                  <TableHead>
                    <tr>
                      <TableCell>POS</TableCell>
                      <TableCell>TEAM</TableCell>
                      <TableCell>P</TableCell>
                      <TableCell>W</TableCell>
                      <TableCell>L</TableCell>
                      <TableCell className="pts-cell">PTS</TableCell>
                      <TableCell className="nrr-cell">NRR</TableCell>
                    </tr>
                  </TableHead>
                  {renderTableBody(sortedTeams)}
                </Table>
                <TableFooterNote>Top {NUM_QUALIFIERS} Teams Qualify For Playoffs</TableFooterNote>
              </>
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