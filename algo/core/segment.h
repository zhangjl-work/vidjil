#ifndef SEGMENT_H
#define SEGMENT_H

#include <string>
#include <iostream>
#include "fasta.h"
#include "dynprog.h"
#include "tools.h"
#include "germline.h"
#include "kmerstore.h"
#include "kmeraffect.h"
#include "affectanalyser.h"
#include "json.h"

#define EXTEND_D_ZONE 5

#define MIN_D_LENGTH 5          /* If a D-REGION is smaller than this threshold, it is not output */

#define RATIO_STRAND 5          /* The ratio between the affectations in one
                                   strand and the other, to safely attribute a
                                   segment to a given strand */

#define DETECT_THRESHOLD 5      /* If the number of both V and J affectations
                                   is above this threshold, then the sequence,
                                   if it not segmented, will be marked as AMBIGUOUS */

#define JSON_REMEMBER_BEST  4   /* The number of V/D/J predictions to keep  */

#define NO_LIMIT_VALUE  -1

#define THRESHOLD_NB_EXPECTED 1.0 /* Threshold of the accepted expected value for number of found k-mers */



using namespace std;

enum SEGMENTED { NOT_PROCESSED,
		 TOTAL_SEG_AND_WINDOW,
                 SEG_PLUS, SEG_MINUS,
                 UNSEG_TOO_SHORT, UNSEG_STRAND_NOT_CONSISTENT,
		 UNSEG_TOO_FEW_ZERO,  UNSEG_TOO_FEW_V, UNSEG_TOO_FEW_J, 
		 UNSEG_BAD_DELTA_MIN, UNSEG_BAD_DELTA_MAX, UNSEG_AMBIGUOUS, UNSEG_NOISY,
		 UNSEG_TOO_SHORT_FOR_WINDOW,

		 STATS_SIZE } ;
const char* const segmented_mesg[] = { "?",
                                       "SEG",
                                       "SEG_+", "SEG_-",
                                       "UNSEG too short", "UNSEG strand",
				       "UNSEG too few (0)", "UNSEG too few V", "UNSEG too few J",
				       "UNSEG < delta_min", "UNSEG > delta_max", "UNSEG ambiguous",
                                       "UNSEG noisy",
                                       "UNSEG too short w",
                                      } ;

class Segmenter {
protected:
  string sequence;
  int Vend, Jstart;
  int Dstart, Dend;
  int CDR3start, CDR3end;
  bool reversed, segmented, dSegmented;
  int because;

  string removeChevauchement();
  bool finishSegmentation();
  bool finishSegmentationD();

 public:
  Germline *segmented_germline;
  string label;
  string code;
  string code_short;
  string code_light;
  string info;        // .vdj.fa header, fixed fields
  string info_extra;  // .vdj.fa header, other information, at the end of the header
  int best_V, best_J ;
  int del_V, del_D_left, del_D_right, del_J ;
  string seg_V, seg_N, seg_J, system;

  int best_D;
  double evalue;
  double evalue_left;
  double evalue_right;
  string seg_N1, seg_D, seg_N2;
  Cost segment_cost;

  virtual ~Segmenter();

  /* Queries */



  Sequence getSequence() const ;

  /**
   * @param l: length around the junction
   * @return the string centered on the junction (ie. at position
   *         (getLeft() + getRight())/2).
   *         The string has length l unless the original string 
   *         is not long enough.
   *         The junction is revcomp-ed if the original string comes from reverse
   *         strand.
   */
  string getJunction(int l) const;

  /**
   * @return the left position (on forward strand) of the segmentation.
   */
  int getLeft() const;
  
  /**
   * @return the right position (on forward strand) of the segmentation
   */
  int getRight() const;
  
  /**
   * @return the left position (on forward strand) of the D segmentation.
   */
  int getLeftD() const;
  
  /**
   * @return the right position (on forward strand) of the D segmentation
   */
  int getRightD() const;

  /**
   * @return true iff the string comes from reverse strand
   */
  bool isReverse() const;

  /**
   * @return true iff the sequence has been successfully segmented
   */
  bool isSegmented() const;
  
  /**
   * @return true if a D gene was found in the N region
   */
  bool isDSegmented() const;

  /**
   * @return the status of the segmentation. Tells if the Sequence has been segmented
   *         of if it has not, what the reason is.
   * @assert getSegmentationStatus() == SEG_PLUS || getSegmentationStatus() == SEG_MINUS
   *         <==> isSegmented()
   */
  int getSegmentationStatus() const;

  string getInfoLine() const;

  /**
   * @post status == SEG_PLUS || status == SEG_MINUS <==> isSegmented()
   */
  void setSegmentationStatus(int status);

  friend ostream &operator<<(ostream &out, const Segmenter &s);
};



ostream &operator<<(ostream &out, const Segmenter &s);



class KmerSegmenter : public Segmenter
{
 private:
  KmerAffectAnalyser *kaa;
 protected:
  string affects;

 public:
  int score;
  int pvalue_left;
  int pvalue_right;

  KmerSegmenter();
  /**
   * Build a segmenter based on KmerSegmentation
   * @param seq: An object read from a FASTA/FASTQ file
   * @param germline: the germline
   */
  KmerSegmenter(Sequence seq, Germline *germline, double threshold = THRESHOLD_NB_EXPECTED, int multiplier=1);

  KmerSegmenter(const KmerSegmenter &seg);

  ~KmerSegmenter();

  /**
   * @return the KmerAffectAnalyser of the current sequence.
   */
  KmerAffectAnalyser *getKmerAffectAnalyser() const;

  void toJsonList(JsonList *seg);

 private:
  void computeSegmentation(int strand, KmerAffect left, KmerAffect right,
                           int delta_min, int delta_max,
                           double threshold, int multiplier);
};


class KmerMultiSegmenter
{
 private:
  double threshold_nb_expected;
 public:
  /**
   * @param seq: An object read from a FASTA/FASTQ file
   * @param multigermline: the multigerm
   * @param threshold: threshold of randomly expected segmentation
   */
  KmerMultiSegmenter(Sequence seq, MultiGermline *multigermline, ostream *out_unsegmented,
                     double threshold = THRESHOLD_NB_EXPECTED, int nb_reads_for_evalue = 1);

  ~KmerMultiSegmenter();

  KmerSegmenter *the_kseg;
  MultiGermline *multi_germline;
};


class FineSegmenter : public Segmenter
{
 public:
   vector<pair<int, int> > score_V;
   vector<pair<int, int> > score_D;
   vector<pair<int, int> > score_J;
   
   /**
   * Build a fineSegmenter based on KmerSegmentation
   * @param seq: An object read from a FASTA/FASTQ file
   * @param germline: germline used
   */
  FineSegmenter(Sequence seq, Germline *germline, Cost segment_cost);
  
  /**
  * extend segmentation from VJ to VDJ
  * @param germline: germline used
  */
  void FineSegmentD(Germline *germline);
  void findCDR3();

  void toJsonList(JsonList *seg);
  
};



#endif
