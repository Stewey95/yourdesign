"use client";

import { useCallback, useRef, useState } from "react";

type StateUpdate<T> = T | ((current: T) => T);

const HISTORY_LIMIT = 50;

const resolveUpdate = <T,>(update: StateUpdate<T>, current: T) =>
  typeof update === "function"
    ? (update as (value: T) => T)(current)
    : update;

const statesMatch = <T,>(first: T, second: T) =>
  JSON.stringify(first) === JSON.stringify(second);

export default function useEditorHistory<T>(initialState: T) {
  const [present, setPresent] = useState(initialState);
  const [past, setPast] = useState<T[]>([]);
  const [future, setFuture] = useState<T[]>([]);
  const presentRef = useRef(initialState);
  const pastRef = useRef<T[]>([]);
  const futureRef = useRef<T[]>([]);
  const transactionStartRef = useRef<T | null>(null);

  const replacePast = useCallback((nextPast: T[]) => {
    const limitedPast = nextPast.slice(-HISTORY_LIMIT);

    pastRef.current = limitedPast;
    setPast(limitedPast);
  }, []);

  const replaceFuture = useCallback((nextFuture: T[]) => {
    futureRef.current = nextFuture;
    setFuture(nextFuture);
  }, []);

  const replacePresent = useCallback((nextPresent: T) => {
    presentRef.current = nextPresent;
    setPresent(nextPresent);
  }, []);

  const beginTransaction = useCallback(() => {
    if (transactionStartRef.current === null) {
      transactionStartRef.current = presentRef.current;
    }
  }, []);

  const commitTransaction = useCallback(() => {
    const transactionStart = transactionStartRef.current;

    if (transactionStart === null) return;

    transactionStartRef.current = null;

    if (statesMatch(transactionStart, presentRef.current)) {
      return;
    }

    replacePast([...pastRef.current, transactionStart]);
    replaceFuture([]);
  }, [replaceFuture, replacePast]);

  const commit = useCallback(
    (update: StateUpdate<T>) => {
      commitTransaction();

      const current = presentRef.current;
      const next = resolveUpdate(update, current);

      if (statesMatch(current, next)) return;

      replacePast([...pastRef.current, current]);
      replaceFuture([]);
      replacePresent(next);
    },
    [commitTransaction, replaceFuture, replacePast, replacePresent]
  );

  const updateTransaction = useCallback(
    (update: StateUpdate<T>) => {
      const current = presentRef.current;
      const next = resolveUpdate(update, current);

      if (statesMatch(current, next)) return;

      replacePresent(next);
    },
    [replacePresent]
  );

  const undo = useCallback(() => {
    const transactionStart = transactionStartRef.current;

    if (
      transactionStart !== null &&
      !statesMatch(transactionStart, presentRef.current)
    ) {
      const current = presentRef.current;

      transactionStartRef.current = null;
      replaceFuture([current, ...futureRef.current]);
      replacePresent(transactionStart);

      return transactionStart;
    }

    transactionStartRef.current = null;

    const previous = pastRef.current.at(-1);

    if (previous === undefined) return undefined;

    replacePast(pastRef.current.slice(0, -1));
    replaceFuture([presentRef.current, ...futureRef.current]);
    replacePresent(previous);

    return previous;
  }, [replaceFuture, replacePast, replacePresent]);

  const redo = useCallback(() => {
    commitTransaction();

    const next = futureRef.current[0];

    if (next === undefined) return undefined;

    replacePast([...pastRef.current, presentRef.current]);
    replaceFuture(futureRef.current.slice(1));
    replacePresent(next);

    return next;
  }, [commitTransaction, replaceFuture, replacePast, replacePresent]);

  const isTransactionActive = useCallback(
    () => transactionStartRef.current !== null,
    []
  );

  return {
    present,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    commit,
    updateTransaction,
    beginTransaction,
    commitTransaction,
    isTransactionActive,
    undo,
    redo,
  };
}
