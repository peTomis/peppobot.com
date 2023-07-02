interface Props {
  height?: string;
  width?: string;
}

const PeppobotIcon = ({ height, width }: Props) => {
  return (
    <svg
      version="1.0"
      xmlns="http://www.w3.org/2000/svg"
      width={width ?? "1000pt"}
      height={height ?? "1000pt"}
      viewBox="0 0 1735.000000 1735.000000"
      preserveAspectRatio="xMidYMid meet"
    >
      <g transform="translate(0.000000,1735.000000) scale(0.100000,-0.100000)" fill="#000000" stroke="none">
        <path
          d="M9030 15214 c-232 -49 -426 -246 -475 -479 -92 -442 298 -832 740
-740 180 38 344 163 424 326 94 190 94 378 0 568 -123 249 -411 385 -689 325z"
        />
        <path
          d="M8450 12500 c-327 -46 -604 -183 -836 -414 -124 -125 -218 -257 -288
-407 -70 -151 -100 -261 -132 -486 l-5 -32 -1107 -4 c-1066 -4 -1111 -5 -1217
-24 -475 -89 -858 -286 -1180 -608 -329 -329 -533 -732 -612 -1210 -17 -104
-18 -229 -18 -2350 0 -2121 1 -2246 18 -2350 79 -478 283 -881 612 -1210 330
-329 732 -532 1210 -612 105 -17 275 -18 3780 -18 3505 0 3675 1 3780 18 478
80 880 283 1210 612 329 330 532 732 612 1210 17 104 18 229 18 2350 0 2121
-1 2246 -18 2350 -80 478 -283 880 -612 1210 -323 322 -704 519 -1180 608
-106 20 -150 20 -1262 24 l-1152 4 -5 32 c-32 225 -62 335 -132 486 -131 281
-380 539 -653 676 -103 51 -247 102 -356 125 -114 24 -369 35 -475 20z m-2105
-4869 c126 -26 235 -71 343 -141 470 -304 604 -926 299 -1394 -303 -464 -922
-596 -1387 -295 -613 396 -612 1292 2 1689 219 142 491 193 743 141z m4930 0
c126 -26 235 -71 343 -141 470 -304 604 -926 299 -1394 -303 -464 -922 -596
-1387 -295 -613 396 -612 1292 2 1689 219 142 491 193 743 141z"
        />
      </g>
    </svg>
  );
};

export default PeppobotIcon;
