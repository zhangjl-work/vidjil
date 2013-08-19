/*
  This file is part of "Vidjil" <http://bioinfo.lifl.fr/vidjil>
  Copyright (C) 2011, 2012, 2013 by Bonsai bioinformatics at LIFL (UMR CNRS 8022, Université Lille) and Inria Lille
  Contributors: Mathieu Giraud <mathieu.giraud@lifl.fr>, Mikaël Salson <mikael.salson@lifl.fr>

  "Vidjil" is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  "Vidjil" is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with "Vidjil". If not, see <http://www.gnu.org/licenses/>
*/

#include "labels.h"
#include <cmath>
#include <cstdlib>
#include "tools.h"

map <string, string> load_map(string map_file)
{
  // Loads a simple file with key, values into a map
  map <string, string> the_map ;
  
  if (!map_file.size())
    return the_map ;

  cout << "  <== " << map_file ;

  ifstream f(map_file.c_str());
      
  if (!f.is_open())
    {
      cout << "  [failed] " << endl ;
      return the_map ;
    }

  int nb_keys = 0 ;

  while (f.good())
    {
      string line ;
      getline (f, line);

      int i = line.find(" ");
      if (i != (int) string::npos)
	{
	  string key = line.substr(0, i);
	  string value = line.substr(i+1, string::npos);
	  
	  nb_keys++ ;      
	  the_map[key] = value + " " + the_map[key];
	}
    }

  cout << ": " << nb_keys << " elements" << endl ;

  return the_map ;
}


map <string, pair <string, float> > load_map_norm(string map_file)
{
  // Loads a simple file with key, values, normalization into a map
  map <string, pair <string, float> > the_map ;
  
  if (!map_file.size())
    return the_map ;

  cout << "  <== " << map_file ;

  ifstream f(map_file.c_str());
      
  if (!f.is_open())
    {
      cout << "  [failed] " << endl ;
      return the_map ;
    }

  int nb_keys = 0 ;

  while (f.good())
    {
      string line ;
      getline (f, line);

      int i = line.find(" ");
      int j = line.find(" ", i+1);

      if (i != (int) string::npos && j  != (int) string::npos) 
	{
	  string key = line.substr(0, i);
	  string value = line.substr(i+1, j);
	  float norm = atof(line.substr(j+1, string::npos).c_str());
	  
	  nb_keys++ ;      
	  the_map[key] = make_pair(value + " " + the_map[key].first, norm + the_map[key].second);

	  cout << key << " " << value << " " << norm << endl ;
	}


    }

  cout << ": " << nb_keys << " elements" << endl ;

  return the_map ;
}


list< pair <float, int> > compute_normalization_list(map<string, list<Sequence> > &seqs_by_window, 
						     map <string, pair <string, float> > normalization,
						     int total
						     )
{
  list< pair <float, int> > result;
  for (map <string, pair <string, float> >::iterator it = normalization.begin(); 
       it != normalization.end(); 
       it++) {
    int nb_occs = seqs_by_window[it->second.first].size();
    float norm = it->second.second / (nb_occs*1. / total);
    result.push_back(make_pair(norm, nb_occs)); 
  }
  result.sort(pair_occurrence_sort<float>);
  return result;
}

float compute_normalization(list< pair <float, int> > norm_list, int nb_reads)
{
  list<pair <float, int> >::const_iterator it;
  // Traverse the list until we find the interesting position (in-between
  // someone bigger and smaller)
  for (it = norm_list.begin();
       it != norm_list.end() && nb_reads <= it->second ; it++) {}
  // At the end the iterator is on the smallest value that is bigger than nb_reads

  float higher_norm = it->first;
  int higher_value = it->second;
  
  if (it == norm_list.begin()) {
    // We are above the higher standard
    return higher_norm;
  } else {
    it++;
    if (it != norm_list.end()) {
      float lower_norm = it->first;
      int lower_value = it->second;

      float ratio = (log(nb_reads) - log(lower_value)) / (log(higher_value) - log(lower_value));

      PRINT_VAR(ratio);
      PRINT_VAR(lower_value);
      PRINT_VAR(higher_value);
      PRINT_VAR(nb_reads);

      return lower_norm + (higher_norm - lower_norm) * ratio;
    } else {
      // We are below the lowest standard
      return higher_norm;
    }
  }
}
