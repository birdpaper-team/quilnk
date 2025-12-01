import gulp from "gulp";
import concat from "gulp-concat";
import gulpSass from "gulp-sass";
import dartSass from "sass";
import { distPkgRoot } from "../paths";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";

export async function concatFiles() {
  const sass = gulpSass(dartSass as any);
  const outDir = join(distPkgRoot, "theme");

  const cssDir = join(outDir, "src");
  const scssDir = join(outDir, "scss");
  if (!existsSync(cssDir)) mkdirSync(cssDir, { recursive: true });
  if (!existsSync(scssDir)) mkdirSync(scssDir, { recursive: true });

  new Promise((resolve, reject) => {
    gulp
      .src([`${outDir}/scss/index.scss`, `${distPkgRoot}/es/style.css`], { allowEmpty: true })
      .pipe(concat("index.scss"))
      .pipe(gulp.dest(scssDir))
      .on("end", resolve)
      .on("error", reject);
  });

  await new Promise((resolve) => {
    gulp
      .src([`${outDir}/index.css`, `${distPkgRoot}/es/style.css`], { allowEmpty: true })
      .pipe(sass.sync())
      .pipe(concat("index.css"))
      .pipe(gulp.dest(cssDir))
      .on("end", resolve);
  });
}
