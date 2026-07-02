// Soft pink leaf/plant illustration anchored at the bottom of the sidebar,
// echoing the decorative art in the reference screenshots.
export function LeafDecoration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 260"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {/* layered pink "hills" */}
      <path
        d="M0 190C40 150 70 175 110 160C150 145 190 165 220 150V260H0V190Z"
        fill="#fbd6dd"
        opacity="0.7"
      />
      <path
        d="M0 220C50 200 90 215 130 205C170 195 200 210 220 200V260H0V220Z"
        fill="#f6b9c6"
        opacity="0.8"
      />
      {/* stem */}
      <path
        d="M56 250C56 210 58 170 66 138"
        stroke="#e78ba0"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* leaves */}
      <path
        d="M66 150C66 130 78 112 100 106C96 128 86 146 66 150Z"
        fill="#ef9aad"
      />
      <path
        d="M62 176C62 158 50 142 30 138C33 158 42 174 62 176Z"
        fill="#f2aebd"
      />
      <path
        d="M60 204C60 188 72 172 92 168C89 186 80 200 60 204Z"
        fill="#ef9aad"
      />
      <path
        d="M57 128C57 112 46 98 28 95C31 112 39 126 57 128Z"
        fill="#f4bccb"
      />
    </svg>
  );
}
