import { useEffect, useId, useState } from "react";
import { diveProfileData, formatDiveTime } from "./dive-profile-data";
import {
  profileDurationSeconds,
  tissueBarPosition,
  tissueStateAt,
} from "./tissue-profile-data";
import "./DiveChart.css";
import "./TissueProfileDiagram.css";

const timelinePath = diveProfileData
  .map(
    ({ time, depth }, i) =>
      `${i ? "L" : "M"}${(((time * 60) / profileDurationSeconds) * 600).toFixed(2)},${(8 + depth * 2.4).toFixed(2)}`,
  )
  .join(" ");

export default function TissueProfileDiagram() {
  const id = useId();
  const [seconds, setSeconds] = useState(0);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const state = tissueStateAt(seconds);
  const markerX = (seconds / profileDurationSeconds) * 600;
  return (
    <div
      className="dive-chart tissue-profile"
      data-chart="tissue-profile"
      role="group"
      aria-label="Tissue loading through the dive"
    >
      <div className="dive-chart-heading">Inside the sixteen compartments</div>
      <p className="dive-chart-subtitle">
        Move through the dive to watch nitrogen load and unload.
      </p>
      <dl className="dive-chart-metrics">
        <div>
          <dt>Elapsed time</dt>
          <dd data-metric="time">{formatDiveTime(seconds / 60)}</dd>
        </div>
        <div>
          <dt>Depth</dt>
          <dd data-metric="depth">{state.depth.toFixed(1)} m</dd>
        </div>
        <div>
          <dt>Model ceiling</dt>
          <dd>{state.ceiling.toFixed(2)} m</dd>
        </div>
      </dl>

      <svg
        className="tissue-timeline"
        viewBox="-4 0 608 82"
        role="img"
        aria-label={`Dive profile, selected time ${formatDiveTime(seconds / 60)}, depth ${state.depth.toFixed(1)} metres`}
      >
        <line
          x1="0"
          x2="600"
          y1="8"
          y2="8"
          className="tissue-timeline-surface"
        />
        <path
          d={timelinePath}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
        />
        <line
          x1={markerX}
          x2={markerX}
          y1="0"
          y2="78"
          stroke="var(--foreground)"
          strokeDasharray="3 3"
        />
        <circle
          cx={markerX}
          cy={8 + state.depth * 2.4}
          r="4"
          fill="var(--foreground)"
        />
      </svg>
      <div className="tissue-slider-label">
        <label htmlFor={id}>Dive timeline</label>
        <span>0:00–31:45</span>
      </div>
      <input
        id={id}
        type="range"
        min="0"
        max={profileDurationSeconds}
        step="1"
        value={seconds}
        disabled={!ready}
        onChange={(event) => setSeconds(Number(event.target.value))}
        aria-valuetext={`${formatDiveTime(seconds / 60)} elapsed, ${state.depth.toFixed(1)} metres`}
      />
      <noscript>
        <p>
          Enable JavaScript to move through the dive. This snapshot shows
          surface equilibrium before descent.
        </p>
      </noscript>

      <div className="tissue-columns" aria-hidden="true">
        <span>#</span>
        <span>Pressure increases →</span>
        <span>N₂ bar</span>
      </div>
      <div
        className="tissue-rows"
        role="group"
        aria-label="Sixteen compartments, fastest to slowest"
      >
        {state.tissues.map((entry) => {
          const end = Math.min(
            100,
            tissueBarPosition(entry.tension, state.ambient, entry.mValue),
          );
          const inspired = tissueBarPosition(
            state.inspired,
            state.ambient,
            entry.mValue,
          );
          const arrow =
            entry.direction === "On-gassing"
              ? "↑"
              : entry.direction === "Off-gassing"
                ? "↓"
                : "=";
          return (
            <div
              key={entry.number}
              className="tissue-row"
              role="img"
              aria-label={`Compartment ${entry.number}, ${entry.tension.toFixed(3)} bar, ${entry.direction}`}
            >
              <span className="tissue-row-name">
                {String(entry.number).padStart(2, "0")}
              </span>
              <span className="tissue-track" aria-hidden="true">
                <span
                  className="tissue-fill tissue-below"
                  style={{ width: `${Math.min(60, end)}%` }}
                />
                {end > 60 && (
                  <span
                    className="tissue-fill tissue-above"
                    style={{ left: "60%", width: `${Math.min(30, end - 60)}%` }}
                  />
                )}
                {end > 90 && (
                  <span
                    className="tissue-fill tissue-over"
                    style={{ left: "90%", width: `${end - 90}%` }}
                  />
                )}
                <span
                  className="tissue-marker tissue-inspired"
                  style={{ left: `${inspired}%` }}
                />
                <span className="tissue-marker tissue-ambient" />
                <span className="tissue-marker tissue-limit" />
              </span>
              <span className="tissue-value">
                {entry.tension.toFixed(2)} <span>{arrow}</span>
              </span>
            </div>
          );
        })}
      </div>
      <ul className="tissue-legend" aria-label="Pressure markers">
        <li>
          <span className="tissue-key tissue-inspired" />
          Inspired N₂
        </li>
        <li>
          <span className="tissue-key tissue-ambient" />
          Ambient
        </li>
        <li>
          <span className="tissue-key tissue-limit" />
          M-value
        </li>
      </ul>
      <p className="tissue-directions">
        ↑ On-gassing · ↓ Off-gassing · = Equilibrium
      </p>
    </div>
  );
}
