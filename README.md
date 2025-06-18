# Sounds good to me

When the vibe coding generate code to vibe on code.

## Install reqs

```
uv pip install -r requirements.txt
```

## Run

```
uv run python ./codebase_analyzer.py /PATH/TO/CODE/PACKAGE/
```

This code base sounds like [this](https://strudel.cc/#c2V0Y3BtKDgwKQogIHN0YWNrKAogICAgcygiYmQqNCBbaGg8MSAyPl0qMiIpLmdhaW4oMC4yKSwKICAgIHMoImdtX2VwaWFubzIqMiIpLAogICAgbigiMCAyIDQgNSIpLnMoImdtX2VwaWFubzIiKS5jbGlwKDIpLnBhbigtMC41KS5yb29tKDAuNTIpLAogCiAgICBzKCJnbV9rb3RvICogNiIpLm4oIjMgNCA1IDYgOCA5IikuZGVncmFkZUJ5KDAuMikuZ2FpbigwLjEpCiAgKQo%3D):

Code generated:

```
setcpm(80)
  stack(
    s("bd*4 [hh<1 2>]*2").gain(0.2),
    s("gm_epiano2*2"),
    n("0 2 4 5").s("gm_epiano2").clip(2).pan(-0.5).room(0.52),

    s("gm_koto * 6").n("3 4 5 6 8 9").degradeBy(0.2).gain(0.1)
  )
```
