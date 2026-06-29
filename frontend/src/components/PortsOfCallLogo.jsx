import bannerImg from '../assets/lobby/logo-banner.png';
import ringImg   from '../assets/lobby/logo-ring.png';

export default function PortsOfCallLogo({ className, style } = {}) {
  return (
    <div
      className={`poc-logo-wrapper${className ? ` ${className}` : ''}`}
      style={style}
      aria-label="Ports of Call"
    >
      <img
        src={bannerImg}
        alt="Ports of Call"
        className="poc-logo-banner"
        draggable="false"
      />

      <img
        src={ringImg}
        alt=""
        aria-hidden="true"
        className="poc-logo-ring"
        draggable="false"
      />
    </div>
  );
}
