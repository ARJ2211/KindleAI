import { ObjectId } from "mongodb";
import {
  user_library,
  annotations,
  books,
} from "../config/mongoCollections.js";
import * as helper from "../helper.js";

export const getUserAnalytics = async (userId) => {
  userId = helper.isValidString(userId);

  const libCol = await user_library();
  const annCol = await annotations();
  const booksCol = await books();

  //Fetch all library entries
  const libraryEntries = await libCol
    .find({ user_id: userId, saved: true })
    .sort({
      last_opened_at: -1,
      added_at: -1,
    })
    .toArray();

  const totalBooks = libraryEntries.length;

  if (totalBooks === 0) {
    return {
      summary: {
        totalBooks: 0,
        completed: 0,
        inProgress: 0,
        notStarted: 0,
        averageProgress: 0,
        favoritesCount: 0,
      },
      annotations: {
        totalNotes: 0,
        totalHighlights: 0,
        totalBookmarks: 0,
        totalAnnotations: 0,
        mostAnnotatedBook: null,
      },
      behavior: {
        lastOpenedBook: null,
        closestToFinishing: null,
        mostEngagedTitle: null,
        mostNotesBook: null,
      },
      perBook: [],
      insights: [],
    };
  }

  //Compute summary stats
  const completed = libraryEntries.filter(
    (e) => e.progress_percent >= 100,
  ).length;

  const inProgress = libraryEntries.filter(
    (e) => e.progress_percent > 0 && e.progress_percent < 100,
  ).length;

  const notStarted = libraryEntries.filter(
    (e) => !e.progress_percent || e.progress_percent === 0,
  ).length;

  const totalProgress = libraryEntries.reduce(
    (sum, e) => sum + (e.progress_percent || 0),
    0,
  );

  const averageProgress = Math.round(totalProgress / totalBooks);
  const favoritesCount = libraryEntries.filter((e) => e.favorite).length;

  //Fetch all annotations for this user
  const allAnnotations = await annCol
    .find({
      user_id: userId,
    })
    .toArray();

  const totalNotes = allAnnotations.filter((a) => a.type === "note").length;

  const totalHighlights = allAnnotations.filter(
    (a) => a.type === "highlight",
  ).length;

  const totalBookmarks = allAnnotations.filter(
    (a) => a.type === "bookmark",
  ).length;
  const totalAnnotations = allAnnotations.length;

  //Compute per-book annotation counts
  const annotationsByBook = {};
  for (const ann of allAnnotations) {
    const bid = ann.book_id.toString();
    if (!annotationsByBook[bid]) {
      annotationsByBook[bid] = {
        notes: 0,
        highlights: 0,
        bookmarks: 0,
        total: 0,
      };
    }
    annotationsByBook[bid].total++;
    if (ann.type === "note") {
      annotationsByBook[bid].notes++;
    } else if (ann.type === "highlight") {
      annotationsByBook[bid].highlights++;
    } else if (ann.type === "bookmark") {
      annotationsByBook[bid].bookmarks++;
    }
  }

  //Fetch book details for all library books
  const bookIds = libraryEntries.map((e) => new ObjectId(e.book_id));
  const bookDocs = await booksCol
    .find({
      _id: { $in: bookIds },
    })
    .toArray();
  const bookMap = {};
  for (const b of bookDocs) {
    bookMap[b._id.toString()] = b;
  }

  //Build per-book analytics
  const perBook = libraryEntries.map((entry) => {
    const bid = entry.book_id.toString();
    const book = bookMap[bid] || {};
    const annCounts = annotationsByBook[bid] || {
      notes: 0,
      highlights: 0,
      bookmarks: 0,
      total: 0,
    };

    return {
      bookId: bid,
      title: book.title || "Unknown",
      author: book.author || "Unknown",
      coverUrl: book.cover_asset_key || null,
      progressPercent: entry.progress_percent || 0,
      currentChapter: entry.current_chapter || null,
      lastOpenedAt: entry.last_opened_at || null,
      addedAt: entry.added_at || null,
      favorite: entry.favorite || false,
      notes: annCounts.notes,
      highlights: annCounts.highlights,
      bookmarks: annCounts.bookmarks,
      totalAnnotations: annCounts.total,
    };
  });

  //Compute behavior stats
  const openedBooks = perBook.filter((b) => b.lastOpenedAt);
  const lastOpenedBook =
    openedBooks.length > 0
      ? [...openedBooks].sort(
          (a, b) => new Date(b.lastOpenedAt) - new Date(a.lastOpenedAt),
        )[0]
      : null;

  const inProgressBooks = perBook.filter(
    (b) => b.progressPercent > 0 && b.progressPercent < 100,
  );

  const closestToFinishing =
    inProgressBooks.length > 0
      ? inProgressBooks.sort((a, b) => b.progressPercent - a.progressPercent)[0]
      : null;

  //Most engaged = highest total annotations
  const annotatedBooks = perBook.filter((b) => b.totalAnnotations > 0);
  const mostAnnotatedBook =
    annotatedBooks.length > 0
      ? annotatedBooks.sort(
          (a, b) => b.totalAnnotations - a.totalAnnotations,
        )[0]
      : null;

  // Most notes
  const booksWithNotes = perBook.filter((b) => b.notes > 0);
  const mostNotesBook =
    booksWithNotes.length > 0
      ? booksWithNotes.sort((a, b) => b.notes - a.notes)[0]
      : null;

  //Most engaged title = combination of progress + annotations
  const mostEngagedTitle =
    perBook.length > 0
      ? perBook
          .map((b) => ({
            ...b,
            engagementScore:
              b.progressPercent * 0.4 + b.totalAnnotations * 10 * 0.6,
          }))
          .sort((a, b) => b.engagementScore - a.engagementScore)[0]
      : null;

  //Compute smart insights
  const insights = [];
  if (closestToFinishing) {
    insights.push({
      icon: "target",
      text: `You're closest to finishing "${closestToFinishing.title}" — ${closestToFinishing.progressPercent}% done!`,
    });
  }

  if (mostEngagedTitle && mostEngagedTitle.totalAnnotations > 0) {
    insights.push({
      icon: "fire",
      text: `Your most engaged title is ${mostEngagedTitle.title}`,
    });
  }

  if (mostNotesBook) {
    insights.push({
      icon: "pencil",
      text: `You take the most notes in "${mostNotesBook.title}" (${mostNotesBook.notes} notes)`,
    });
  }

  //book not opened in a while

  const now = new Date();
  const staleBooks = openedBooks.filter((b) => {
    const lastOpened = new Date(b.lastOpenedAt);
    const daysSince = (now - lastOpened) / (1000 * 60 * 60 * 24);
    return daysSince > 14 && b.progressPercent < 100;
  });
  if (staleBooks.length > 0) {
    const stalest = staleBooks.sort(
      (a, b) => new Date(a.lastOpenedAt) - new Date(b.lastOpenedAt),
    )[0];
    const daysSince = Math.floor(
      (now - new Date(stalest.lastOpenedAt)) / (1000 * 60 * 60 * 24),
    );
    insights.push({
      icon: "clock",
      text: `You haven't opened "${stalest.title}" in ${daysSince} days`,
    });
  }

  if (completed > 0) {
    insights.push({
      icon: "trophy",
      text: `You've completed ${completed} ${completed === 1 ? "book" : "books"} — nice work!`,
    });
  }

  if (totalAnnotations > 0 && totalBooks > 0) {
    const avgAnnotations = Math.round(totalAnnotations / totalBooks);
    insights.push({
      icon: "chart",
      text: `You average about ${avgAnnotations} annotation${avgAnnotations !== 1 ? "s" : ""} per book`,
    });
  }

  return {
    summary: {
      totalBooks,
      completed,
      inProgress,
      notStarted,
      averageProgress,
      favoritesCount,
    },

    readingStatusChart: [
      { name: "Completed", value: completed },
      { name: "In Progress", value: inProgress },
      { name: "Not Started", value: notStarted },
    ],

    topAnnotatedBooks: [...perBook]
      .filter((b) => b.totalAnnotations > 0)
      .sort((a, b) => b.totalAnnotations - a.totalAnnotations)
      .slice(0, 5)
      .map((b) => ({
        title: b.title,
        bookId: b.bookId,
        totalAnnotations: b.totalAnnotations,
        notes: b.notes,
        highlights: b.highlights,
        bookmarks: b.bookmarks,
      })),

    annotations: {
      totalNotes,
      totalHighlights,
      totalBookmarks,
      totalAnnotations,
      mostAnnotatedBook: mostAnnotatedBook
        ? {
            title: mostAnnotatedBook.title,
            bookId: mostAnnotatedBook.bookId,
            count: mostAnnotatedBook.totalAnnotations,
          }
        : null,
    },
    behavior: {
      lastOpenedBook: lastOpenedBook
        ? {
            title: lastOpenedBook.title,
            bookId: lastOpenedBook.bookId,
            lastOpenedAt: lastOpenedBook.lastOpenedAt,
          }
        : null,
      closestToFinishing: closestToFinishing
        ? {
            title: closestToFinishing.title,
            bookId: closestToFinishing.bookId,
            progressPercent: closestToFinishing.progressPercent,
          }
        : null,
      mostEngagedTitle: mostEngagedTitle
        ? {
            title: mostEngagedTitle.title,
            bookId: mostEngagedTitle.bookId,
          }
        : null,
      mostNotesBook: mostNotesBook
        ? {
            title: mostNotesBook.title,
            bookId: mostNotesBook.bookId,
            count: mostNotesBook.notes,
          }
        : null,
    },
    perBook,
    insights,
  };
};
