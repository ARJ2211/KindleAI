import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  CircularProgress,
  LinearProgress,
  Tooltip,
  IconButton,
} from "@mui/material";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutline";
import FavoriteIcon from "@mui/icons-material/Favorite";
import StickyNote2OutlinedIcon from "@mui/icons-material/StickyNote2Outlined";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import TipsAndUpdatesIcon from "@mui/icons-material/TipsAndUpdates";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import EditNoteIcon from "@mui/icons-material/EditNote";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import BarChartIcon from "@mui/icons-material/BarChart";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import LocalFireDepartmentOutlinedIcon from "@mui/icons-material/LocalFireDepartmentOutlined";
import api from "../../api/axios.js";

const INSIGHT_ICONS = {
  target: <TrackChangesIcon sx={{ fontSize: 16, color: "#00e0ff" }} />,
  fire: <WhatshotIcon sx={{ fontSize: 16, color: "#ff9f43" }} />,
  pencil: <EditNoteIcon sx={{ fontSize: 16, color: "#a78bfa" }} />,
  clock: <AccessTimeIcon sx={{ fontSize: 16, color: "#fbbf24" }} />,
  trophy: <EmojiEventsOutlinedIcon sx={{ fontSize: 16, color: "#4ade80" }} />,
  chart: <BarChartIcon sx={{ fontSize: 16, color: "#38bdf8" }} />,
};

const STATUS_COLORS = {
  Completed: "#4ade80",
  "In Progress": "#00e0ff",
  "Not Started": "#3f3f46",
};

// Mini Pie Chart uses readingStatusChart
const MiniPieChart = ({ readingStatusChart }) => {
  const total = readingStatusChart.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <Box sx={styles.chartEmpty}>
        <Typography sx={styles.chartEmptyText}>No books yet</Typography>
      </Box>
    );
  }

  const slices = readingStatusChart
    .filter((d) => d.value > 0)
    .map((d) => ({
      ...d,
      color: STATUS_COLORS[d.name] || "#52525b",
    }));

  const cx = 80,
    cy = 80,
    r = 48,
    strokeWidth = 22;
  const circumference = 2 * Math.PI * r;

  // Build slice data with offsets
  var cumulativeOffset = 0;
  const sliceData = slices.map((slice) => {
    const pct = slice.value / total;
    const length = pct * circumference;
    const offset = cumulativeOffset;
    cumulativeOffset += length;
    return { ...slice, length, offset, pct };
  });

  // Each slice animates in sequence — stagger delay based on offset
  // Total animation ~0.8s, each slice sweeps proportionally
  const totalDuration = 0.8;

  return (
    <Box sx={styles.chartContainer}>
      <svg viewBox="0 0 160 160" width="140" height="140">
        {/* Background track */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.03)"
          strokeWidth={strokeWidth}
        />

        {/* Animated slices */}
        {sliceData.map((slice) => {
          const delay = (slice.offset / circumference) * totalDuration;
          const duration = Math.max(slice.pct * totalDuration, 0.1);

          return (
            <circle
              key={slice.name}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={slice.color}
              strokeWidth={strokeWidth}
              strokeLinecap="butt"
              opacity="0.85"
              strokeDasharray={`${slice.length} ${circumference - slice.length}`}
              strokeDashoffset={-slice.offset}
              transform={`rotate(-90 ${cx} ${cy})`}
              style={{
                animation: `pieSliceIn ${duration}s ease-out ${delay}s both`,
              }}
            />
          );
        })}

        {/* Center cutout */}
        <circle cx={cx} cy={cy} r="35" fill="#0a0a0f" />

        {/* Center text */}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          fill="#e4e4e8"
          fontSize="18"
          fontFamily="'Syne', sans-serif"
          fontWeight="700"
          style={{
            animation: "pieFadeIn 0.4s ease-out 0.5s both",
          }}
        >
          {total}
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          fill="#52525b"
          fontSize="8"
          fontFamily="'JetBrains Mono', monospace"
          letterSpacing="0.08em"
          style={{
            animation: "pieFadeIn 0.4s ease-out 0.6s both",
          }}
        >
          BOOKS
        </text>

        {/* Keyframes injected via <style> inside SVG */}
        <style>
          {`
            @keyframes pieSliceIn {
              from {
                stroke-dasharray: 0 ${circumference};
              }
            }
            @keyframes pieFadeIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }
          `}
        </style>
      </svg>

      <Box sx={styles.legend}>
        {slices.map((s) => (
          <Box key={s.name} sx={styles.legendItem}>
            <Box
              sx={{
                ...styles.legendDot,
                background: s.color,
                boxShadow: `0 0 6px ${s.color}66`,
              }}
            />
            <Typography sx={styles.legendLabel}>{s.name}</Typography>
            <Typography sx={styles.legendValue}>{s.value}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

//Bar Chart uses topAnnotatedBooks
const AnnotationBarChart = ({ topAnnotatedBooks }) => {
  if (!topAnnotatedBooks || topAnnotatedBooks.length === 0) {
    return (
      <Box sx={styles.chartEmpty}>
        <Typography sx={styles.chartEmptyText}>No annotations yet</Typography>
      </Box>
    );
  }

  const maxVal = Math.max(...topAnnotatedBooks.map((b) => b.totalAnnotations));
  const barWidth = 36;
  const gap = 16;
  const chartWidth = topAnnotatedBooks.length * (barWidth + gap) - gap + 40;
  const chartHeight = 180;
  const barAreaHeight = 120;

  return (
    <Box sx={{ overflowX: "auto" }}>
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        width={Math.min(chartWidth, 400)}
        height={chartHeight}
        style={{ display: "block", margin: "0 auto" }}
      >
        {topAnnotatedBooks.map((book, i) => {
          const x = 20 + i * (barWidth + gap);

          const truncated =
            book.title.length > 10 ? book.title.slice(0, 9) + "…" : book.title;

          const notesH = maxVal > 0 ? (book.notes / maxVal) * barAreaHeight : 0;
          const highlightsH =
            maxVal > 0 ? (book.highlights / maxVal) * barAreaHeight : 0;
          const bookmarksH =
            maxVal > 0 ? (book.bookmarks / maxVal) * barAreaHeight : 0;

          const barH = (book.totalAnnotations / maxVal) * barAreaHeight;
          const barY = barAreaHeight - barH + 10;

          let stackY = barAreaHeight + 10;
          const segments = [
            { h: bookmarksH, color: "#fbbf24" },
            { h: highlightsH, color: "#a78bfa" },
            { h: notesH, color: "#00e0ff" },
          ];

          return (
            <g key={book.bookId} style={{ cursor: "pointer" }}>
              <title>{`${book.title}`}</title>
              <rect
                x={x}
                y={10}
                width={barWidth}
                height={barAreaHeight}
                rx={4}
                fill="rgba(255,255,255,0.03)"
              />
              {segments.map((seg, si) => {
                if (seg.h <= 0) return null;
                stackY -= seg.h;
                return (
                  <rect
                    key={si}
                    x={x}
                    y={stackY}
                    width={barWidth}
                    height={seg.h}
                    rx={si === segments.length - 1 ? 4 : 0}
                    fill={seg.color}
                    opacity="0.8"
                  />
                );
              })}
              <text
                x={x + barWidth / 2}
                y={barY - 4}
                textAnchor="middle"
                fill="#a1a1aa"
                fontSize="9"
                fontFamily="'JetBrains Mono', monospace"
              >
                {book.totalAnnotations}
              </text>
              <text
                x={x + barWidth / 2}
                y={barAreaHeight + 26}
                textAnchor="middle"
                fill="#52525b"
                fontSize="7"
                fontFamily="'DM Sans', sans-serif"
              >
                {truncated}
              </text>
            </g>
          );
        })}
      </svg>
      <Box sx={styles.barLegend}>
        <Box sx={styles.legendItem}>
          <Box sx={{ ...styles.legendDot, background: "#00e0ff" }} />
          <Typography sx={styles.legendLabel}>Notes</Typography>
        </Box>
        <Box sx={styles.legendItem}>
          <Box sx={{ ...styles.legendDot, background: "#a78bfa" }} />
          <Typography sx={styles.legendLabel}>Highlights</Typography>
        </Box>
        <Box sx={styles.legendItem}>
          <Box sx={{ ...styles.legendDot, background: "#fbbf24" }} />
          <Typography sx={styles.legendLabel}>Bookmarks</Typography>
        </Box>
      </Box>
    </Box>
  );
};

const BehaviorCard = ({ icon, label, value, sub, accent = "#00e0ff" }) => {
  return (
    <Box sx={styles.behaviorCardItem}>
      <Box sx={{ ...styles.behaviorIcon, color: accent }}>{icon}</Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={styles.behaviorLabel}>{label}</Typography>
        <Typography sx={styles.behaviorValue} noWrap>
          {value}
        </Typography>
        {sub && <Typography sx={styles.behaviorSub}>{sub}</Typography>}
      </Box>
    </Box>
  );
};

// Stat Card
const StatCard = ({ icon, label, value, accent = "#00e0ff" }) => {
  return (
    <Box sx={styles.statCard}>
      <Box sx={{ ...styles.statIcon, color: accent }}>{icon}</Box>
      <Typography sx={styles.statValue}>{value}</Typography>
      <Typography sx={styles.statLabel}>{label}</Typography>
    </Box>
  );
};

//Section Header
const SectionHeader = ({ index, title }) => {
  return (
    <Box sx={styles.sectionHeader}>
      <Typography sx={styles.sectionIndex}>{index}</Typography>
      <Typography sx={styles.sectionTitle}>{title}</Typography>
      <Box sx={styles.sectionLine} />
    </Box>
  );
};

// Book Raw
const BookRaw = ({ book, onClick }) => {
  const progress = book.progressPercent || 0;
  const lastOpened = book.lastOpenedAt
    ? new Date(book.lastOpenedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "Never";

  return (
    <Box sx={styles.bookRow} onClick={onClick}>
      <Box sx={styles.bookRowLeft}>
        <Box sx={styles.bookRowCover}>
          {book.coverUrl ? (
            <img
              src={book.coverUrl}
              alt={book.title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: 4,
              }}
            />
          ) : (
            <AutoStoriesIcon
              sx={{
                fontSize: 18,
                color: "rgba(0, 224, 255, 0.25)",
              }}
            />
          )}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            <Typography sx={styles.bookRowTitle} noWrap>
              {book.title}
            </Typography>
            {book.favorite && (
              <FavoriteIcon
                sx={{
                  fontSize: 12,
                  color: "#ff5078",
                  flexShrink: 0,
                }}
              />
            )}
          </Box>
          <Typography sx={styles.bookRowAuthor} noWrap>
            {book.author}
          </Typography>
        </Box>
      </Box>

      <Box sx={styles.bookRowRight}>
        <Box sx={styles.bookRowProgress}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={styles.bookRowBar}
          />
          <Typography sx={styles.bookRowPct}>{progress}%</Typography>
        </Box>
        <Box sx={styles.bookRowAnnotations}>
          <Tooltip title="Notes">
            <Box sx={styles.annBadge}>
              <StickyNote2OutlinedIcon sx={{ fontSize: 11 }} />
              <span>{book.notes}</span>
            </Box>
          </Tooltip>
          <Tooltip title="Highlights">
            <Box sx={styles.annBadge}>
              <FormatQuoteIcon sx={{ fontSize: 11 }} />
              <span>{book.highlights}</span>
            </Box>
          </Tooltip>
          <Tooltip title="Bookmarks">
            <Box sx={styles.annBadge}>
              <BookmarkBorderIcon sx={{ fontSize: 11 }} />
              <span>{book.bookmarks}</span>
            </Box>
          </Tooltip>
        </Box>
        <Typography sx={styles.bookRowDate}>{lastOpened}</Typography>
      </Box>
    </Box>
  );
};

const MyReading = ({ onAlert }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/analytics");
      setData(res.data);
    } catch (error) {
      const msg = error.response?.data?.msg || "Failed to load analytics";
      setError(msg);
      onAlert?.({ message: msg, severity: "error" });
    } finally {
      setLoading(false);
    }
  }, [onAlert]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          py: 8,
        }}
      >
        <CircularProgress size={28} sx={{ color: "#00e0ff" }} />
      </Box>
    );
  }
  if (error) {
    return (
      <Box sx={styles.empty}>
        <Typography
          sx={{
            color: "#ff6b6b",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {error}
        </Typography>
      </Box>
    );
  }
  if (!data || data.summary.totalBooks === 0) {
    return (
      <Box sx={styles.empty}>
        <AutoStoriesIcon sx={{ fontSize: 48, color: "rgba(0,224,255,0.15)" }} />
        <Typography sx={styles.emptyText}>
          No reading data yet. Add books to My Books and start reading to see
          your analytics.
        </Typography>
      </Box>
    );
  }

  const {
    summary,
    readingStatusChart,
    topAnnotatedBooks,
    annotations: ann,
    behavior,
    perBook,
    insights,
  } = data;

  const lastOpenedDate = behavior.lastOpenedBook?.lastOpenedAt
    ? new Date(behavior.lastOpenedBook.lastOpenedAt).toLocaleDateString(
        "en-US",
        { month: "short", day: "numeric" },
      )
    : null;
  const hasBehavior =
    behavior.lastOpenedBook ||
    behavior.closestToFinishing ||
    behavior.mostEngagedTitle ||
    behavior.mostNotesBook;
  return (
    <div>
      <Box sx={styles.root}>
        <Box sx={styles.pageHeader}>
          <Box>
            <Typography sx={styles.pageTitle}>My Reading</Typography>
            <Typography sx={styles.pageSubtitle}>
              Your personal reading analytics
            </Typography>
          </Box>

          <Tooltip title="Refresh">
            <IconButton onClick={fetchAnalytics} sx={styles.refreshBtn}>
              <RefreshIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Reading Snapshot */}
        <SectionHeader index="01" title="Reading Snapshot" />
        <Box sx={styles.statsGrid}>
          <StatCard
            icon={<MenuBookIcon sx={{ fontSize: 20 }} />}
            label="Total Books"
            value={summary.totalBooks}
          />
          <StatCard
            icon={<CheckCircleOutlineIcon sx={{ fontSize: 20 }} />}
            label="Completed"
            value={summary.completed}
            accent="#4ade80"
          />
          <StatCard
            icon={<HourglassEmptyIcon sx={{ fontSize: 20 }} />}
            label="In Progress"
            value={summary.inProgress}
          />
          <StatCard
            icon={<PauseCircleOutlineIcon sx={{ fontSize: 20 }} />}
            label="Not Started"
            value={summary.notStarted}
            accent="#52525b"
          />
          <StatCard
            icon={<BarChartIcon sx={{ fontSize: 20 }} />}
            label="Avg Progress"
            value={`${summary.averageProgress}%`}
            accent="#38bdf8"
          />
          <StatCard
            icon={<FavoriteIcon sx={{ fontSize: 20 }} />}
            label="Favorites"
            value={summary.favoritesCount}
            accent="#ff5078"
          />
        </Box>

        {hasBehavior && (
          <Box sx={styles.behaviorGrid}>
            {behavior.lastOpenedBook && (
              <BehaviorCard
                icon={<VisibilityOutlinedIcon sx={{ fontSize: 18 }} />}
                label="Last Opened"
                value={behavior.lastOpenedBook.title}
                sub={lastOpenedDate}
                accent="#00e0ff"
              />
            )}
            {behavior.closestToFinishing && (
              <BehaviorCard
                icon={<FlagOutlinedIcon sx={{ fontSize: 18 }} />}
                label="Closest to Finishing"
                value={behavior.closestToFinishing.title}
                sub={`${behavior.closestToFinishing.progressPercent}% done`}
                accent="#4ade80"
              />
            )}
            {behavior.mostEngagedTitle && (
              <BehaviorCard
                icon={<LocalFireDepartmentOutlinedIcon sx={{ fontSize: 18 }} />}
                label="Most Engaged"
                value={behavior.mostEngagedTitle.title}
                accent="#ff9f43"
              />
            )}
            {behavior.mostNotesBook && (
              <BehaviorCard
                icon={<EditNoteIcon sx={{ fontSize: 18 }} />}
                label="Most Notes"
                value={behavior.mostNotesBook.title}
                sub={`${behavior.mostNotesBook.count} notes`}
                accent="#a78bfa"
              />
            )}
          </Box>
        )}

        {/* Pie chart */}

        <Box sx={styles.chartCard}>
          <Typography sx={styles.chartTitle}>Reading Status</Typography>
          <MiniPieChart readingStatusChart={readingStatusChart} />
        </Box>

        {/* Annotation Activity */}
        <SectionHeader index="02" title="Annotation Activity" />
        <Box sx={styles.statsGrid}>
          <StatCard
            icon={<StickyNote2OutlinedIcon sx={{ fontSize: 20 }} />}
            label="Notes"
            value={ann.totalNotes}
          />
          <StatCard
            icon={<FormatQuoteIcon sx={{ fontSize: 20 }} />}
            label="Highlights"
            value={ann.totalHighlights}
            accent="#a78bfa"
          />
          <StatCard
            icon={<BookmarkBorderIcon sx={{ fontSize: 20 }} />}
            label="Bookmarks"
            value={ann.totalBookmarks}
            accent="#fbbf24"
          />
        </Box>

        {ann.mostAnnotatedBook && (
          <Box sx={styles.behaviorCardStandalone}>
            <Typography sx={styles.behaviorLabel}>Most Annotated</Typography>
            <Typography sx={styles.behaviorValue}>
              {ann.mostAnnotatedBook.title}
            </Typography>
            <Typography sx={styles.behaviorSub}>
              {ann.mostAnnotatedBook.count} annotations
            </Typography>
          </Box>
        )}

        {/* Bar Chart */}
        <Box sx={styles.chartCard}>
          <Typography sx={styles.chartTitle}>Top Annotated Books</Typography>
          <AnnotationBarChart topAnnotatedBooks={topAnnotatedBooks} />
        </Box>

        {/* Progress Insights */}

        {insights.length > 0 && (
          <>
            <SectionHeader index="03" title="Progress Insights" />
            <Box sx={styles.insightsCard}>
              <Box sx={styles.insightsHeader}>
                <TipsAndUpdatesIcon sx={{ fontSize: 16, color: "#fbbf24" }} />
                <Typography sx={styles.insightsTitle}>
                  Smart Insights
                </Typography>
              </Box>
              <Box sx={styles.insightsList}>
                {insights.map((insight, i) => (
                  <Box key={i} sx={styles.insightRow}>
                    {INSIGHT_ICONS[insight.icon] || (
                      <TipsAndUpdatesIcon
                        sx={{ fontSize: 16, color: "#52525b" }}
                      />
                    )}
                    <Typography sx={styles.insightText}>
                      {insight.text}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </>
        )}

        {/* Book by book breakdown */}
        <SectionHeader index="04" title="Book-by-Book Breakdown" />
        <Box sx={styles.bookList}>
          <Box sx={styles.bookListHeader}>
            <Typography sx={styles.colHeader}>Book</Typography>
            <Box sx={styles.bookRowRight}>
              <Typography sx={{ ...styles.colHeader, width: 100 }}>
                Progress
              </Typography>
              <Typography sx={{ ...styles.colHeader, width: 90 }}>
                Annotations
              </Typography>
              <Typography sx={{ ...styles.colHeader, width: 60 }}>
                Opened
              </Typography>
            </Box>
          </Box>

          {perBook.map((book) => (
            <BookRaw
              key={book.bookId}
              book={book}
              onClick={() => navigate(`/reader/${book.bookId}`)}
            />
          ))}
        </Box>
      </Box>
    </div>
  );
};

export default MyReading;

const styles = {
  root: {
    maxWidth: 900,
    mx: "auto",
    pb: 8,
  },
  pageHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    mb: 4,
  },
  pageTitle: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: "1.6rem",
    color: "#e4e4e8",
    lineHeight: 1.2,
  },
  pageSubtitle: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.7rem",
    color: "#3f3f46",
    letterSpacing: "0.08em",
    mt: 0.5,
  },
  refreshBtn: {
    color: "#52525b",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "8px",
    width: 34,
    height: 34,
    "&:hover": {
      color: "#00e0ff",
      borderColor: "rgba(0, 224, 255, 0.2)",
      background: "rgba(0, 224, 255, 0.04)",
    },
  },

  // ── Section headers ──
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: 1.5,
    mb: 2.5,
    mt: 5,
  },
  sectionIndex: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.65rem",
    color: "#00e0ff",
    letterSpacing: "0.1em",
    opacity: 0.7,
  },
  sectionTitle: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: "1rem",
    color: "#e4e4e8",
    whiteSpace: "nowrap",
  },
  sectionLine: {
    flex: 1,
    height: "1px",
    background: "linear-gradient(90deg, rgba(0,224,255,0.15), transparent 80%)",
  },

  // ── Stat cards ──
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
    gap: 2,
  },
  statCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 0.75,
    p: 2.5,
    borderRadius: "12px",
    background: "rgba(255,255,255,0.015)",
    border: "1px solid rgba(0, 224, 255, 0.06)",
    transition: "all 0.3s",
    "&:hover": {
      borderColor: "rgba(0, 224, 255, 0.15)",
      background: "rgba(0, 224, 255, 0.02)",
    },
  },
  statIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    borderRadius: "10px",
    background: "rgba(0, 224, 255, 0.06)",
  },
  statValue: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: "1.3rem",
    color: "#e4e4e8",
    lineHeight: 1,
  },
  statLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.58rem",
    color: "#52525b",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    textAlign: "center",
  },

  // ── Behavior cards (grid row) ──
  behaviorGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
    gap: 1.5,
    mt: 2.5,
  },
  behaviorCardItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: 1.25,
    p: 2,
    borderRadius: "10px",
    background: "rgba(255,255,255,0.015)",
    border: "1px solid rgba(0, 224, 255, 0.06)",
    transition: "all 0.3s",
    "&:hover": {
      borderColor: "rgba(0, 224, 255, 0.12)",
      background: "rgba(0, 224, 255, 0.02)",
    },
  },
  behaviorIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
    borderRadius: "8px",
    background: "rgba(0, 224, 255, 0.06)",
    flexShrink: 0,
    mt: 0.25,
  },
  behaviorLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.55rem",
    color: "#52525b",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    mb: 0.25,
  },
  behaviorValue: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: "0.82rem",
    color: "#e4e4e8",
    lineHeight: 1.3,
  },
  behaviorSub: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "0.68rem",
    color: "#52525b",
    mt: 0.25,
  },

  // ── Standalone behavior card (most annotated) ──
  behaviorCardStandalone: {
    mt: 2,
    p: 2,
    borderRadius: "10px",
    background: "rgba(255,255,255,0.015)",
    border: "1px solid rgba(0, 224, 255, 0.06)",
  },

  // ── Charts ──
  chartCard: {
    mt: 3,
    p: 3,
    borderRadius: "12px",
    background: "rgba(255,255,255,0.015)",
    border: "1px solid rgba(0, 224, 255, 0.06)",
  },
  chartTitle: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 600,
    fontSize: "0.85rem",
    color: "#a1a1aa",
    mb: 2,
  },
  chartContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  chartEmpty: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    py: 4,
  },
  chartEmptyText: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "0.8rem",
    color: "#3f3f46",
  },
  legend: {
    display: "flex",
    flexDirection: "column",
    gap: 1,
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: 1,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    flexShrink: 0,
  },
  legendLabel: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "0.72rem",
    color: "#a1a1aa",
  },
  legendValue: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.65rem",
    color: "#52525b",
    ml: "auto",
  },
  barLegend: {
    display: "flex",
    justifyContent: "center",
    gap: 2.5,
    mt: 1.5,
  },

  // ── Insights ──
  insightsCard: {
    p: 2.5,
    borderRadius: "12px",
    background:
      "linear-gradient(135deg, rgba(251,191,36,0.03) 0%, rgba(0,224,255,0.02) 100%)",
    border: "1px solid rgba(251,191,36,0.1)",
  },
  insightsHeader: {
    display: "flex",
    alignItems: "center",
    gap: 1,
    mb: 1.5,
  },
  insightsTitle: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 600,
    fontSize: "0.8rem",
    color: "#fbbf24",
  },
  insightsList: {
    display: "flex",
    flexDirection: "column",
    gap: 1,
  },
  insightRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 1,
  },
  insightText: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "0.78rem",
    color: "#d4d4d8",
    lineHeight: 1.5,
  },

  // ── Book-by-book list ──
  bookList: {
    display: "flex",
    flexDirection: "column",
    gap: 0,
  },
  bookListHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    px: 1.5,
    py: 1,
    mb: 0.5,
  },
  colHeader: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.55rem",
    color: "#3f3f46",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  bookRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 2,
    px: 1.5,
    py: 1.25,
    borderRadius: "10px",
    cursor: "pointer",
    transition: "all 0.2s",
    "&:hover": {
      background: "rgba(0, 224, 255, 0.03)",
    },
  },
  bookRowLeft: {
    display: "flex",
    alignItems: "center",
    gap: 1.5,
    flex: 1,
    minWidth: 0,
  },
  bookRowCover: {
    width: 36,
    height: 50,
    borderRadius: "4px",
    overflow: "hidden",
    background: "rgba(0, 224, 255, 0.04)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    border: "1px solid rgba(0, 224, 255, 0.06)",
  },
  bookRowTitle: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 600,
    fontSize: "0.8rem",
    color: "#e4e4e8",
  },
  bookRowAuthor: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "0.68rem",
    color: "#52525b",
    mt: 0.15,
  },
  bookRowRight: {
    display: "flex",
    alignItems: "center",
    gap: 2.5,
    flexShrink: 0,
  },
  bookRowProgress: {
    display: "flex",
    alignItems: "center",
    gap: 1,
    width: 100,
  },
  bookRowBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(0, 224, 255, 0.08)",
    "& .MuiLinearProgress-bar": {
      borderRadius: 2,
      background: "linear-gradient(90deg, #00e0ff, #007cf0)",
    },
  },
  bookRowPct: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.58rem",
    color: "#52525b",
    width: 28,
    textAlign: "right",
  },
  bookRowAnnotations: {
    display: "flex",
    alignItems: "center",
    gap: 1,
    width: 90,
  },
  annBadge: {
    display: "flex",
    alignItems: "center",
    gap: 0.3,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.55rem",
    color: "#52525b",
  },
  bookRowDate: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.55rem",
    color: "#3f3f46",
    width: 60,
    textAlign: "right",
  },

  // ── Empty state ──
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    py: 10,
  },
  emptyText: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "0.9rem",
    color: "#52525b",
    textAlign: "center",
    maxWidth: 360,
  },
};
