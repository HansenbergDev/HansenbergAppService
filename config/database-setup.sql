CREATE TABLE IF NOT EXISTS students (
	id SERIAL NOT NULL,
	name VARCHAR(50),
	enrolled_from DATE,
	enrolled_to DATE,
	created_on TIMESTAMP,

	PRIMARY KEY(id)
);

CREATE TABLE IF NOT EXISTS menus (
     week INT,
     year INT,
     monday VARCHAR(255),
     tuesday VARCHAR(255),
     wednesday VARCHAR(255),
     thursday VARCHAR(255),
     created_on TIMESTAMP,

     PRIMARY KEY(year, week)
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

CREATE TABLE IF NOT EXISTS dietary_preferences (
    student_id INT,

    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    PRIMARY KEY(student_id)
);

