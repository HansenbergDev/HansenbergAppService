DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS menus CASCADE;
DROP TABLE IF EXISTS enlistments;
DROP TABLE IF EXISTS dietary_preferences;
DROP TABLE IF EXISTS admins;
DROP TABLE IF EXISTS enrollments;

CREATE TABLE IF NOT EXISTS students (
	id SERIAL NOT NULL,
	name VARCHAR,
	enrolled_from DATE,
	enrolled_to DATE,
	created_on TIMESTAMP,

	PRIMARY KEY(id)
);

CREATE TABLE IF NOT EXISTS menus (
     week INT,
     year INT,
     monday VARCHAR,
     tuesday VARCHAR,
     wednesday VARCHAR,
     thursday VARCHAR,
     created_on TIMESTAMP,

     PRIMARY KEY(year, week)
);

CREATE TABLE IF NOT EXISTS admins (
  username VARCHAR,
  password VARCHAR,

  PRIMARY KEY (username)
);


CREATE TABLE IF NOT EXISTS enlistments (
  student_id INT,
  week INT,
  year INT,
  monday BOOLEAN,
  tuesday BOOLEAN,
  wednesday BOOLEAN,
  thursday BOOLEAN,
  friday BOOLEAN,
  created_on TIMESTAMP,

  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (year, week) REFERENCES menus(year, week) ON DELETE CASCADE,
  PRIMARY KEY(student_id, year, week)
);

CREATE TABLE IF NOT EXISTS enrollments (
  week INT,
  year INT,
  number_of_enrolled_students INT,
  PRIMARY KEY(week, year)
);

CREATE TABLE IF NOT EXISTS dietary_preferences (
    student_id INT,

    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    PRIMARY KEY(student_id)
);

