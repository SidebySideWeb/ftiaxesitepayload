import Link from 'next/link'
import './welcome.css'

/**
 * CMS Welcome Page
 * A minimal welcome page that directs users to the admin panel
 */
export default function WelcomePage() {
  return (
    <div className="welcome-container">
      <div className="welcome-content">
        {/* Image Section */}
        <div className="welcome-image-wrapper">
          <div className="welcome-image-placeholder">
            <svg
              width="120"
              height="120"
              viewBox="0 0 120 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="20"
                y="20"
                width="80"
                height="80"
                rx="8"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="4 4"
                fill="none"
              />
              <path
                d="M40 50L50 60L80 30"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Text Content */}
        <div className="welcome-text">
          <p className="welcome-intro">
            This is the quiet engine room.
          </p>
          <p className="welcome-intro">
            No glitter, no noise — just a door to where ideas become structure.
          </p>
          <p className="welcome-description">
            Behind that button lives the control panel:
            <br />
            content shaped, pages guided, stories kept clean and sharp.
            <br />
            If you&apos;re here, you&apos;re meant to steer, not scroll.
          </p>
          <p className="welcome-cta">
            Step inside.
            <br />
            Take the wheel.
            <br />
            Build with intention.
          </p>
        </div>

        {/* Admin Button */}
        <Link href="/admin" className="welcome-button">
          [Enter Admin Panel]
        </Link>
      </div>
    </div>
  )
}
