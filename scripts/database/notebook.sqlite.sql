SELECT
  *
FROM
  events
WHERE
  DATE(start) = '2025-11-05'
  summary LIKE '%mercury%retrograde%'
ORDER BY
  start ASC;